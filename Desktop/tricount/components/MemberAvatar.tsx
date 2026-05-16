'use client'

import { cn } from '@/lib/utils'
import { useMemberAvatar } from '@/lib/utils/avatars'

interface MemberAvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  userId?: string
}

const sizes = {
  sm: 'w-6 h-6 text-[10px] rounded-[7px]',
  md: 'w-8 h-8 text-xs rounded-[10px]',
  lg: 'w-10 h-10 text-sm rounded-xl',
  xl: 'w-14 h-14 text-lg rounded-2xl',
}

export function MemberAvatar({ name, color, size = 'md', className, userId }: MemberAvatarProps) {
  const photoUrl = useMemberAvatar(userId)

  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={cn('object-cover select-none flex-shrink-0', sizes[size], className)}
        style={{ border: `1.5px solid ${color}40` }}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center font-mono font-semibold select-none flex-shrink-0',
        sizes[size],
        className
      )}
      style={{ backgroundColor: color + '22', color, border: `1.5px solid ${color}40` }}
    >
      {initials}
    </div>
  )
}
