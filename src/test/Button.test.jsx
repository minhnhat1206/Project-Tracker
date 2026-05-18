import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../components/ui/Button'

describe('Button', () => {
  it('render đúng children', () => {
    render(<Button>Lưu</Button>)
    expect(screen.getByText('Lưu')).toBeInTheDocument()
  })

  it('gọi onClick khi bấm', () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Bấm</Button>)
    fireEvent.click(screen.getByText('Bấm'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('không gọi onClick khi disabled', () => {
    const handler = vi.fn()
    render(<Button onClick={handler} disabled>Bấm</Button>)
    fireEvent.click(screen.getByText('Bấm'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('có attribute disabled khi truyền prop disabled', () => {
    render(<Button disabled>Bấm</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('dùng type="button" mặc định', () => {
    render(<Button>Ok</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('có thể đổi type thành submit', () => {
    render(<Button type="submit">Gửi</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('font nhỏ hơn khi size="sm"', () => {
    render(<Button size="sm">Nhỏ</Button>)
    expect(screen.getByRole('button')).toHaveStyle({ fontSize: '13px' })
  })
})
