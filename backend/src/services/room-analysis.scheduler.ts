import type { RoomService } from './room.service.js'

type RoomAnalysisSchedulerOptions = {
  intervalMs: number
  batchSize: number
}

export class RoomAnalysisScheduler {
  private timer?: NodeJS.Timeout
  private running = false

  constructor(
    private readonly roomService: RoomService,
    private readonly options: RoomAnalysisSchedulerOptions,
  ) {}

  start() {
    if (this.timer) {
      return
    }

    this.timer = setInterval(() => {
      void this.tick()
    }, this.options.intervalMs)
    this.timer.unref()

    console.log(`Room analysis scheduler started every ${this.options.intervalMs}ms`)
  }

  stop() {
    if (!this.timer) {
      return
    }

    clearInterval(this.timer)
    this.timer = undefined
  }

  async tick() {
    if (this.running) {
      return
    }

    this.running = true

    try {
      const cutoffIso = new Date(Date.now() - this.options.intervalMs).toISOString()
      const result = await this.roomService.runDueRoomAnalyses({
        cutoffIso,
        limit: this.options.batchSize,
      })

      if (result.analyzed > 0) {
        console.log(`Room analysis scheduler analyzed ${result.analyzed}/${result.checked} rooms`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown room analysis scheduler error'
      console.error(`Room analysis scheduler failed: ${message}`)
    } finally {
      this.running = false
    }
  }
}
