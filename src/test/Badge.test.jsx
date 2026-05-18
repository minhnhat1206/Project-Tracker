import { render, screen } from '@testing-library/react'
import Badge from '../components/ui/Badge'

describe('Badge', () => {
  it('hiển thị label mặc định theo type', () => {
    render(<Badge type="todo" />)
    expect(screen.getByText('Todo')).toBeInTheDocument()
  })

  it('hiển thị label tuỳ chỉnh khi truyền prop label', () => {
    render(<Badge type="done" label="Hoàn thành" />)
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument()
  })

  it('hiển thị type làm text khi không có trong danh sách', () => {
    render(<Badge type="custom_type" />)
    expect(screen.getByText('custom_type')).toBeInTheDocument()
  })

  it('áp dụng màu đúng cho trạng thái done', () => {
    render(<Badge type="done" />)
    const el = screen.getByText('Done')
    expect(el).toHaveStyle({ color: '#34C759' })
  })

  it('áp dụng màu đúng cho trạng thái cancelled', () => {
    render(<Badge type="cancelled" />)
    const el = screen.getByText('Cancelled')
    expect(el).toHaveStyle({ color: '#FF3B30' })
  })

  it('áp dụng style tuỳ chỉnh', () => {
    render(<Badge type="todo" style={{ fontSize: 20 }} />)
    const el = screen.getByText('Todo')
    expect(el).toHaveStyle({ fontSize: '20px' })
  })
})
