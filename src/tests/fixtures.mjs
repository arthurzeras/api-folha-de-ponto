export function registersForMonth(yyyymm) {
  const [year, month] = yyyymm.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const daysList = [];

  // Gets all days for received month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayString = day < 10 ? `0${day}` : `${day}`;
    const monthNumber = `${month < 10 ? '0' : ''}${month}`;
    daysList.push(`${year}-${monthNumber}-${dayString}`);
  }

  // Filter only commercial days in month (remove Saturday and Sunday but don't consider holidays)
  const commercialDays = daysList.filter(
    (day) => ![0, 6].includes(new Date(day).getDay()),
  );

  return commercialDays.map((day) => {
    return {
      day,
      monthString: day.substring(0, 7),
      registers: ['08:00:00', '12:00:00', '13:00:00', '17:00:00'],
    };
  });
}
