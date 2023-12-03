const REGISTER = {
  HOUR_ALREADY_EXISTS: 'Horário já registrado',
  FAILED_TO_REGISTER: 'Falha ao registrar o evento',
  INVALID_PARAMETER: 'O parâmetro "momento" é obrigatório',
  LUNCH_TOO_SMALL: 'Deve haver no mínimo 1 hora de almoço',
  MAX_HOURS: 'Apenas 4 horários podem ser registrados por dia',
  SATURDAY_SUNDAY_NOT_WORK: 'Sábado e domingo não são permitidos como dia de trabalho', // prettier-ignore
  INVALID_HOUR: 'O horário precisa ser maior do que os que já foram informados anteriormente para este dia', // prettier-ignore
  INVALID_PARAMETER_TYPE: 'O parâmetro "momento" precisa ser uma data válida no formato YYYY-MM-DDTHH:mm:ss', // prettier-ignore
};

const REPORT = {
  INVALID_PARAMETER: 'O mês deve ser informado no formado YYYY-MM',
};

export default {
  REGISTER,
  REPORT,
};
