import { render, screen, fireEvent } from '@testing-library/react'
import EmptyState from '../components/ui/EmptyState'

describe('EmptyState', () => {
  it('hiển thị title', () => {
    render(<EmptyState title="Không có dữ liệu" />)
    expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument()
  })

  it('hiển thị description khi có', () => {
    render(<EmptyState title="Trống" description="Chưa có task nào" />)
    expect(screen.getByText('Chưa có task nào')).toBeInTheDocument()
  })

  it('không render description khi không truyền', () => {
    render(<EmptyState title="Trống" />)
    expect(screen.queryByText(/./)).not.toBeNull()
    // chỉ có title, không có thêm text khác
    expect(screen.getAllByText(/./)).toHaveLength(1)
  })

  it('hiển thị button action khi có cả action và onAction', () => {
    const handler = vi.fn()
    render(<EmptyState title="Trống" action="Tạo mới" onAction={handler} />)
    expect(screen.getByText('Tạo mới')).toBeInTheDocument()
  })

  it('gọi onAction khi bấm button', () => {
    const handler = vi.fn()
    render(<EmptyState title="Trống" action="Tạo mới" onAction={handler} />)
    fireEvent.click(screen.getByText('Tạo mới'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('không hiển thị button khi thiếu onAction', () => {
    render(<EmptyState title="Trống" action="Tạo mới" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('hiển thị icon khi truyền', () => {
    render(<EmptyState title="Trống" icon="📋" />)
    expect(screen.getByText('📋')).toBeInTheDocument()
  })
})
