import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCurrentUser } from '../hooks/useCurrentUser'
import { fetchEvents } from '../lib/eventApi'

const DEFAULT_CENTER = { latitude: 35.681236, longitude: 139.767125 }
const NEARBY_EVENT_RADIUS_METERS = 2500

const INITIAL_LOCATION = {
  latitude: null,
  longitude: null,
  placeName: '取得中...',
}

const GEOLOCATION_ERROR_MESSAGES = {
  1: '位置情報の利用が許可されていません',
  2: '位置情報を取得できませんでした',
  3: '位置情報の取得がタイムアウトしました',
}

function getInitialLocation() {
  if (typeof navigator !== 'undefined' && !navigator.geolocation) {
    return {
      ...INITIAL_LOCATION,
      placeName: '位置情報を使えないブラウザです',
    }
  }
  return INITIAL_LOCATION
}

function createArrowIcon() {
  return L.divIcon({
    className: '',
    html: '<div class="arrow-marker" style="width: 20px; height: 20px; background-color: #06b6d4; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
    iconSize: [24, 28],
    iconAnchor: [12, 20],
  })
}

function getEventColor(heat) {
  if (heat >= 80) {
    return '#f97316'
  }

  if (heat >= 60) {
    return '#8b5cf6'
  }

  return '#10b981'
}

function createEventIcon(event) {
  const color = getEventColor(event.heat)

  return L.divIcon({
    className: '',
    html: `<div class="event-pin" style="--event-color: ${color}"><span></span></div>`,
    iconSize: [42, 52],
    iconAnchor: [21, 48],
    popupAnchor: [0, -42],
  })
}

async function reverseGeocode(latitude, longitude) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('accept-language', 'ja')

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.status}`)
  }
  return response.json()
}

function formatCoordinate(value) {
  return Number.isFinite(value) ? value.toFixed(6) : '取得中...'
}

function getGeolocationErrorMessage(error) {
  if (error?.code && GEOLOCATION_ERROR_MESSAGES[error.code]) {
    return GEOLOCATION_ERROR_MESSAGES[error.code]
  }

  if (error?.message) {
    return error.message
  }

  return '位置情報を取得できませんでした'
}

function calculateDistanceMeters(
  fromLatitude,
  fromLongitude,
  toLatitude,
  toLongitude,
) {
  const earthRadiusMeters = 6371000
  const fromLatRad = toRadians(fromLatitude)
  const toLatRad = toRadians(toLatitude)
  const latitudeDelta = toRadians(toLatitude - fromLatitude)
  const longitudeDelta = toRadians(toLongitude - fromLongitude)

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatRad) *
      Math.cos(toLatRad) *
      Math.sin(longitudeDelta / 2) ** 2

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(degree) {
  return (degree * Math.PI) / 180
}

export function MapPage() {
  const { isReady } = useCurrentUser()
  const navigate = useNavigate()
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const nearbyCircleRef = useRef(null)
  const eventLayersRef = useRef([])
  const currentPositionRef = useRef(null)
  const hasCenteredRef = useRef(false)
  const lastLookupRef = useRef({ key: '', at: 0 })
  const watchIdRef = useRef(null)

  const [locationInfo, setLocationInfo] = useState(getInitialLocation)

  // 地図の初期化処理
  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return undefined
    }

    const map = L.map(mapElementRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude], 16)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const marker = L.marker(
      [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude],
      {
        icon: createArrowIcon(),
      },
    ).addTo(map)

    const nearbyCircle = L.circle(
      [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude],
      {
        radius: NEARBY_EVENT_RADIUS_METERS,
        color: 'rgba(255, 255, 255, 0.82)',
        weight: 1.5,
        fillColor: 'rgba(255, 255, 255, 0.82)',
        fillOpacity: 0.50,
      },
    ).addTo(map)

    mapRef.current = map
    markerRef.current = marker
    nearbyCircleRef.current = nearbyCircle

    return () => {
      eventLayersRef.current.forEach((layer) => layer.remove())
      map.remove()
      mapRef.current = null
      markerRef.current = null
      nearbyCircleRef.current = null
      eventLayersRef.current = []
    }
  }, [])

  // 位置情報の追跡処理
  useEffect(() => {
    if (
      !isReady ||
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      return undefined
    }

    let cancelled = false
    let hasReceivedPosition = false
    let latestEventRequestId = 0

    const renderEvents = (events, currentPosition) => {
      eventLayersRef.current.forEach((layer) => layer.remove())

      eventLayersRef.current = events.flatMap((event) => {
        if (!Number.isFinite(event.latitude) || !Number.isFinite(event.longitude)) {
          return []
        }

        const color = getEventColor(event.heat)
        const isInsideEventZone =
          currentPosition &&
          calculateDistanceMeters(
            currentPosition.latitude,
            currentPosition.longitude,
            event.latitude,
            event.longitude,
          ) <= event.radius
        const circle = L.circle([event.latitude, event.longitude], {
          radius: event.radius,
          className: isInsideEventZone
            ? 'event-zone event-zone--active'
            : 'event-zone',
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.14,
        }).addTo(mapRef.current)

        const eventMarker = L.marker([event.latitude, event.longitude], {
          icon: createEventIcon(event),
        })
          .bindPopup(
            `
              <div class="event-popup">
                <strong>${event.title}</strong><br>
                ${event.address}<br>
                盛り上がり度: ${event.heat}<br>
                半径: ${event.radius}m
                <button
                  class="event-popup__button"
                  data-event-id="${event.id}"
                  ${isInsideEventZone ? '' : 'disabled'}
                  type="button"
                >
                  チャットルームへ
                </button>
              </div>
            `,
          )
          .addTo(mapRef.current)

        eventMarker.on('popupopen', (popupEvent) => {
          const button = popupEvent.popup
            ?.getElement()
            ?.querySelector('[data-event-id]')

          if (!button || !isInsideEventZone) {
            return
          }

          button.addEventListener('click', () => {
            navigate(`/${event.id}`)
          }, { once: true })
        })

        return [circle, eventMarker]
      })
    }

    const loadNearbyEvents = async (latitude, longitude) => {
      latestEventRequestId += 1
      const requestId = latestEventRequestId

      eventLayersRef.current.forEach((layer) => layer.remove())
      eventLayersRef.current = []

      try {
        const events = await fetchEvents({ latitude, longitude })

        if (cancelled || requestId !== latestEventRequestId) {
          return
        }

        renderEvents(events, { latitude, longitude })
      } catch (error) {
        console.error(error)
      }
    }

    const updateArrowHeading = (heading) => {
      const arrow = markerRef.current
        ?.getElement()
        ?.querySelector('.arrow-marker')

      if (!arrow) {
        return
      }

      const angle = Number.isFinite(heading) ? heading : 0
      arrow.style.transform = `rotate(${angle}deg)`
    }

    const handlePosition = async (position) => {
      if (cancelled) {
        return
      }

      hasReceivedPosition = true

      const latitude = position.coords.latitude
      const longitude = position.coords.longitude
      const heading = position.coords.heading
      const lookupKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`
      const now = Date.now()

      currentPositionRef.current = { latitude, longitude }

      markerRef.current?.setLatLng([latitude, longitude])
      nearbyCircleRef.current?.setLatLng([latitude, longitude])
      updateArrowHeading(heading)

      if (!hasCenteredRef.current) {
        mapRef.current?.setView([latitude, longitude], 18)
        hasCenteredRef.current = true
      } else {
        mapRef.current?.panTo([latitude, longitude], {
          animate: true,
          duration: 0.8,
        })
      }

      setLocationInfo({
        latitude,
        longitude,
        placeName: '地名を取得中...',
      })

      void loadNearbyEvents(latitude, longitude)

      if (
        lookupKey === lastLookupRef.current.key &&
        now - lastLookupRef.current.at < 5000
      ) {
        return
      }

      try {
        const result = await reverseGeocode(latitude, longitude)
        if (cancelled) return

        lastLookupRef.current = { key: lookupKey, at: now }
        setLocationInfo({
          latitude,
          longitude,
          placeName: result.name || result.display_name || '地名なし',
        })
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setLocationInfo({
            latitude,
            longitude,
            placeName: '地名を取得できませんでした',
          })
        }
      }
    }

    const handlePositionError = (error) => {
      console.error(error)

      if (cancelled) {
        return
      }

      if (error?.code === error?.TIMEOUT && !hasReceivedPosition) {
        navigator.geolocation.getCurrentPosition(
          handlePosition,
          (fallbackError) => {
            if (cancelled) {
              return
            }

            setLocationInfo((current) => ({
              ...current,
              placeName: `位置情報エラー: ${getGeolocationErrorMessage(fallbackError)}`,
            }))
          },
          {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 60000,
          },
        )

        return
      }

      setLocationInfo((current) => ({
        ...current,
        placeName: `位置情報エラー: ${getGeolocationErrorMessage(error)}`,
      }))
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 15000,
    }

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handlePositionError,
      {
        ...options,
        maximumAge: 0,
      },
    )

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handlePositionError,
      options,
    )

    return () => {
      cancelled = true
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return (
    <div className="current-location-map w-full h-screen relative">
      <div 
        className="current-location-map__canvas w-full h-full" 
        ref={mapElementRef} 
        style={{ background: '#e5e7eb' }} 
      />
      
      <aside className="info-panel absolute bottom-6 left-6 right-6 z-[1000] bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-stone-200/50">
        <h1 className="info-title font-black text-xl mb-3 text-stone-800 tracking-tight">Current Location</h1>
        <div className="space-y-2">
          <p className="info-row flex justify-between text-sm text-stone-600">
            <span className="info-label font-bold text-stone-400">緯度</span>
            <span className="font-mono bg-stone-100 px-2 py-0.5 rounded">{formatCoordinate(locationInfo.latitude)}</span>
          </p>
          <p className="info-row flex justify-between text-sm text-stone-600">
            <span className="info-label font-bold text-stone-400">経度</span>
            <span className="font-mono bg-stone-100 px-2 py-0.5 rounded">{formatCoordinate(locationInfo.longitude)}</span>
          </p>
          <div className="pt-2 border-t border-stone-100 flex justify-between items-start text-sm text-stone-600">
            <span className="info-label font-bold text-stone-400 mt-0.5">地名</span>
            <span className="font-bold text-teal-600 text-right max-w-[70%] break-words">{locationInfo.placeName}</span>
          </div>
        </div>
      </aside>
    </div>
  )
}