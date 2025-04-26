// Configuração para testes
import '@testing-library/jest-dom'

// Silence React warnings in tests
beforeAll(() => {
  const originalConsoleError = console.error
  console.error = (...args) => {
    if (
      args[0]?.includes?.('Warning:') &&
      (args[0]?.includes?.('ReactDOM.render') ||
       args[0]?.includes?.('React.createFactory'))
    ) {
      return
    }
    originalConsoleError(...args)
  }
}) 