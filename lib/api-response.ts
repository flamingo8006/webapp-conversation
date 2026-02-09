import { NextResponse } from 'next/server'

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export function apiBadRequest(message: string) {
  return apiError(message, 400)
}

export function apiUnauthorized(message = 'Unauthorized') {
  return apiError(message, 401)
}

export function apiForbidden(message = 'Forbidden') {
  return apiError(message, 403)
}

export function apiNotFound(message = 'Not found') {
  return apiError(message, 404)
}

export function apiInternalError(message = 'Internal server error') {
  return apiError(message, 500)
}
