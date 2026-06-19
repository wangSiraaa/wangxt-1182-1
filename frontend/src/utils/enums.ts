export enum UserRole {
  RESEARCH_CENTER = 'research_center',
  CUSTOMS_OFFICER = 'customs_officer',
  CENTRAL_LAB = 'central_lab',
  ADMIN = 'admin',
}

export enum SampleBoxStatus {
  DRAFT = 'draft',
  REGISTERED = 'registered',
  PENDING_EXPORT_APPROVAL = 'pending_export_approval',
  EXPORT_APPROVED = 'export_approved',
  EXPORT_REJECTED = 'export_rejected',
  EXPORTED = 'exported',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  TEMP_NORMAL = 'temp_normal',
  TEMP_ABNORMAL = 'temp_abnormal',
  FROZEN = 'frozen',
  THAWED = 'thawed',
  DESTROYED = 'destroyed',
}

export enum DocumentType {
  ETHICS_APPROVAL = 'ethics_approval',
  CUSTOMS_DECLARATION = 'customs_declaration',
  BIOLOGICAL_SAMPLE_PERMIT = 'biological_sample_permit',
  SHIPPING_INVOICE = 'shipping_invoice',
  PACKING_LIST = 'packing_list',
  HEALTH_CERTIFICATE = 'health_certificate',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
}

export enum FreezeReason {
  TEMP_EXCEEDED = 'temp_exceeded',
  FLIGHT_DELAY = 'flight_delay',
  OTHER = 'other',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ApprovalType {
  EXPORT = 'export',
  FREEZE = 'freeze',
  THAW = 'thaw',
  DESTROY = 'destroy',
}
