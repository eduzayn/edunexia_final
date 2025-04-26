import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Componente simples para teste
function ExampleComponent() {
  return <div>Exemplo de componente para teste</div>
}

describe('Exemplo de teste', () => {
  it('deve renderizar o componente corretamente', () => {
    render(<ExampleComponent />)
    expect(screen.getByText('Exemplo de componente para teste')).toBeInTheDocument()
  })

  it('deve realizar operações matemáticas básicas', () => {
    expect(1 + 1).toBe(2)
    expect(2 * 3).toBe(6)
  })
}) 