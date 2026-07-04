import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'

const DEFAULT_CENTER = { latitude: 35.681236, longitude: 139.767125 }

const INITIAL_LOCATION = {
  latitude: null,
  longitude: null,
  placeName: '取得中...',
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

export function MapPage() {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const hasCenteredRef = useRef(false)
  const lastLookupRef = useRef({ key: '', at: 0 })
  const watchIdRef = useRef(null)

  const [locationInfo, setLocationInfo] = useState(getInitialLocation)

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

    const marker = L.marker([DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude], {
      icon: createArrowIcon(),
    }).addTo(map)

    mapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return undefined
    }

    let cancelled = false

    const updateArrowHeading = (heading) => {
      const arrow = markerRef.current?.getElement()?.querySelector('.arrow-marker')

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

      const latitude = position.coords.latitude
      const longitude = position.coords.longitude
      const heading = position.coords.heading
      const lookupKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`
      const now = Date.now()

      markerRef.current?.setLatLng([latitude, longitude])
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

      if (lookupKey === lastLookupRef.current.key && now - lastLookupRef.current.at < 5000) {
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

      setLocationInfo((current) => ({
        ...current,
        placeName: `位置情報エラー: ${error.message}`,
      }))
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }

    navigator.geolocation.getCurrentPosition(handlePosition, handlePositionError, {
      ...options,
      maximumAge: 0,
    })

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
