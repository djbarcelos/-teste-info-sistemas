/** Alinhado à resposta JSON da API (`Vehicle` Prisma + datas ISO). */
export interface Vehicle {
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

export interface PaginatedVehicles {
  data: Vehicle[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type CreateVehiclePayload = Pick<
  Vehicle,
  'placa' | 'chassi' | 'renavam' | 'modelo' | 'marca' | 'ano'
>;

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;
