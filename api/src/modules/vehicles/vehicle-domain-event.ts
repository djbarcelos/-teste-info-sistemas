export type VehicleDomainEventType = 'created' | 'updated' | 'deleted';

export interface VehicleEventData {
  id: string;
  placa: string;
  chassi: string;
  renavam: string;
  modelo: string;
  marca: string;
  ano: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleDomainEventMessage {
  eventType: VehicleDomainEventType;
  occurredAt: string;
  vehicle: VehicleEventData;
}
