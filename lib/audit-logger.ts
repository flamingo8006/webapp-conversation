import { auditLogRepository, type AuditLogCreateInput } from './repositories/audit-log'

class AuditLogger {
  async log(input: AuditLogCreateInput) {
    try {
      await auditLogRepository.create(input)
    }
    catch (error) {
      // 감사 로그 실패는 메인 작업에 영향을 주지 않음
      console.error('Failed to create audit log:', error)
    }
  }

  // 편의 메서드들
  async logCreate(
    actor: { type: 'admin' | 'user', id?: string | null, loginId: string, name: string, role?: string },
    entityType: string,
    entityId: string,
    data: Record<string, any>,
    request?: { ip?: string, userAgent?: string, path?: string },
  ) {
    await this.log({
      actorType: actor.type,
      actorId: actor.id,
      actorLoginId: actor.loginId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE',
      entityType,
      entityId,
      changes: { after: data },
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      requestPath: request?.path,
      success: true,
    })
  }

  async logUpdate(
    actor: { type: 'admin' | 'user', id?: string | null, loginId: string, name: string, role?: string },
    entityType: string,
    entityId: string,
    before: Record<string, any>,
    after: Record<string, any>,
    request?: { ip?: string, userAgent?: string, path?: string },
  ) {
    await this.log({
      actorType: actor.type,
      actorId: actor.id,
      actorLoginId: actor.loginId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'UPDATE',
      entityType,
      entityId,
      changes: { before, after },
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      requestPath: request?.path,
      success: true,
    })
  }

  async logDelete(
    actor: { type: 'admin' | 'user', id?: string | null, loginId: string, name: string, role?: string },
    entityType: string,
    entityId: string,
    data: Record<string, any>,
    request?: { ip?: string, userAgent?: string, path?: string },
  ) {
    await this.log({
      actorType: actor.type,
      actorId: actor.id,
      actorLoginId: actor.loginId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DELETE',
      entityType,
      entityId,
      changes: { before: data },
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      requestPath: request?.path,
      success: true,
    })
  }

  async logError(
    actor: { type: 'admin' | 'user', id?: string | null, loginId: string, name: string, role?: string },
    action: string,
    entityType: string,
    entityId: string | null,
    errorMessage: string,
    request?: { ip?: string, userAgent?: string, path?: string },
  ) {
    await this.log({
      actorType: actor.type,
      actorId: actor.id,
      actorLoginId: actor.loginId,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      entityType,
      entityId,
      success: false,
      errorMessage,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      requestPath: request?.path,
    })
  }
}

export const auditLogger = new AuditLogger()
