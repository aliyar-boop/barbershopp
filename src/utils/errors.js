export function getErrorMessage(error) {
  const messages = {
    'auth/email-already-in-use': 'Бул email мурда катталган.',
    'auth/invalid-email': 'Email дареги туура эмес.',
    'auth/invalid-credential': 'Email же сырсөз туура эмес.',
    'auth/weak-password': 'Сырсөз кеминде 6 белгиден турушу керек.',
    'auth/too-many-requests': 'Өтө көп аракет болду. Бир аздан кийин кайталап көрүңүз.',
    'permission-denied': 'Бул аракетке уруксатыңыз жок.',
    'unavailable': 'Маалыматка жетүү мүмкүн болгон жок.',
  }
  if (error?.code && messages[error.code]) return messages[error.code]
  return error?.message || 'Белгисиз ката чыкты. Кайра аракет кылыңыз.'
}
