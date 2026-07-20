import FavoritesLink from './FavoritesLink'
import ProfileMenu from './ProfileMenu'

export default function HeaderActions({ className = '' }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <FavoritesLink />
      <ProfileMenu />
    </div>
  )
}
