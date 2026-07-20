import CartLink from './CartLink'
import ProfileMenu from './ProfileMenu'

export default function HeaderActions({ className = '' }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <CartLink />
      <ProfileMenu />
    </div>
  )
}
