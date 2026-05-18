import { render, screen } from '@testing-library/react'
import Avatar from '../components/ui/Avatar'

describe('Avatar', () => {
  it('hiển thị initials từ email', () => {
    // tách theo @ → ['minh', 'nhat.com'] → initials 'MN'
    render(<Avatar email="minh@nhat.com" />)
    expect(screen.getByText('MN')).toBeInTheDocument()
  })

  it('hiển thị initials từ tên đầy đủ', () => {
    render(<Avatar name="Minh Nhat" />)
    expect(screen.getByText('MN')).toBeInTheDocument()
  })

  it('hiển thị "?" khi không có email lẫn name', () => {
    render(<Avatar />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('hiển thị 2 ký tự đầu khi tên chỉ có 1 từ', () => {
    render(<Avatar name="Minh" />)
    expect(screen.getByText('MI')).toBeInTheDocument()
  })

  it('render đúng kích thước theo prop size', () => {
    render(<Avatar email="minh@nhat.com" size={48} />)
    const el = screen.getByTitle('minh@nhat.com')
    expect(el).toHaveStyle({ width: '48px', height: '48px' })
  })

  it('title hiển thị name thay vì email khi có cả hai', () => {
    render(<Avatar email="minh@nhat.com" name="Nhat" />)
    expect(screen.getByTitle('Nhat')).toBeInTheDocument()
  })
})
