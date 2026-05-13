/** Anos permitidos pelo backend (crescente: de 1900 até ano atual + 1). */
export function vehicleYearChoices(): number[] {
  const max = new Date().getFullYear() + 1;
  const years: number[] = [];
  for (let y = 1900; y <= max; y++) {
    years.push(y);
  }
  return years;
}

export function defaultVehicleModelYear(): number {
  return new Date().getFullYear();
}
