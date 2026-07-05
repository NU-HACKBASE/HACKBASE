import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'

import { useCurrentUser } from '../hooks/useCurrentUser'
import { fetchEvents } from '../lib/eventApi'

const DEFAULT_CENTER = { latitude: 35.681236, longitude: 139.767125 }
const NEARBY_EVENT_RADIUS_METERS = 1000

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
    html: '<div class="arrow-marker"></div>',
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
    headers: {
      Accept: 'application/json',
    },
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

export function MapPage() {
  const { isReady } = useCurrentUser()
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const nearbyCircleRef = useRef(null)
  const eventLayersRef = useRef([])
  const hasCenteredRef = useRef(false)
  const lastLookupRef = useRef({ key: '', at: 0 })
  const watchIdRef = useRef(null)

  const [locationInfo, setLocationInfo] = useState(getInitialLocation)

  useEffect(() => {
    if (!isReady || !mapElementRef.current || mapRef.current) {
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
  }, [isReady])

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

    const renderEvents = (events) => {
      eventLayersRef.current.forEach((layer) => layer.remove())

      eventLayersRef.current = events.flatMap((event) => {
        if (!Number.isFinite(event.latitude) || !Number.isFinite(event.longitude)) {
          return []
        }

        const color = getEventColor(event.heat)
        const circle = L.circle([event.latitude, event.longitude], {
          radius: event.radius,
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.14,
        }).addTo(mapRef.current)

        const eventMarker = L.marker([event.latitude, event.longitude], {
          icon: createEventIcon(event),
        })
          .bindPopup(
            `<strong>${event.title}</strong><br>${event.address}<br>盛り上がり度: ${event.heat}<br>半径: ${event.radius}m`,
          )
          .addTo(mapRef.current)

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

        renderEvents(events)
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

        if (cancelled) {
          return
        }

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
  }, [isReady])

  if (!isReady) {
    return null
  }

  return (
    <div className="current-location-map">
      <div className="current-location-map__canvas" ref={mapElementRef} />
      <aside className="info-panel">
        <h1 className="info-title">Current Location</h1>
        <p className="info-row">
          <span className="info-label">緯度</span>
          <span>{formatCoordinate(locationInfo.latitude)}</span>
        </p>
        <p className="info-row">
          <span className="info-label">経度</span>
          <span>{formatCoordinate(locationInfo.longitude)}</span>
        </p>
        <p className="info-row">
          <span className="info-label">地名</span>
          <span>{locationInfo.placeName}</span>
        </p>
      </aside>
    </div>
  )
}
