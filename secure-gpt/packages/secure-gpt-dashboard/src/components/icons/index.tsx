import React from 'react'
import { HugeiconsIcon, type HugeiconsProps } from '@hugeicons/react'
import {
  CreditCardIcon,
  UserIcon,
  SecurityLockIcon,
  Idea01Icon,
  Folder01Icon,
  Alert02Icon,
  ShieldCheckIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Building01Icon,
  InboxIcon as HugeInboxIcon,
  SparklesIcon,
  LockIcon,
  ShieldAlertIcon,
  DashboardSquare01Icon,
  File01Icon,
  Settings01Icon,
  Logout01Icon,
  UserGroupIcon,
  Sun01Icon,
  Moon02Icon,
  DatabaseIcon,
  Search01Icon,
  FilterIcon,
  Download01Icon,
  Upload01Icon,
  PlusSignIcon,
  Delete02Icon,
  Edit02Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ViewIcon,
  ViewOffSlashIcon,
  Loading03Icon,
  Globe02Icon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons'

export interface IconProps extends Omit<HugeiconsProps, 'icon'> {
  size?: number | string
  className?: string
}

function createIcon(iconData: any) {
  const Component = ({ size = 18, className, ...props }: IconProps) => (
    <HugeiconsIcon icon={iconData} size={size} className={className} strokeWidth={1.5} {...props} />
  )
  Component.displayName = 'Icon'
  return Component
}

// Export standardized Hugeicons
export const CardIcon = createIcon(CreditCardIcon)
export const UserProfileIcon = createIcon(UserIcon)
export const SecurityLock = createIcon(SecurityLockIcon)
export const IdeaIcon = createIcon(Idea01Icon)
export const FolderIcon = createIcon(Folder01Icon)
export const AlertIcon = createIcon(Alert02Icon)
export const ShieldCheck = createIcon(ShieldCheckIcon)
export const CheckCircle = createIcon(CheckmarkCircle02Icon)
export const CancelIcon = createIcon(Cancel01Icon)
export const BuildingIcon = createIcon(Building01Icon)
export const InboxIcon = createIcon(HugeInboxIcon)
export const Sparkles = createIcon(SparklesIcon)
export const Lock = createIcon(LockIcon)
export const ShieldAlert = createIcon(ShieldAlertIcon)
export const DashboardIcon = createIcon(DashboardSquare01Icon)
export const FileText = createIcon(File01Icon)
export const SettingsIcon = createIcon(Settings01Icon)
export const LogoutIcon = createIcon(Logout01Icon)
export const UsersIcon = createIcon(UserGroupIcon)
export const SunIcon = createIcon(Sun01Icon)
export const MoonIcon = createIcon(Moon02Icon)
export const Database = createIcon(DatabaseIcon)
export const SearchIcon = createIcon(Search01Icon)
export const Filter = createIcon(FilterIcon)
export const Download = createIcon(Download01Icon)
export const Upload = createIcon(Upload01Icon)
export const Plus = createIcon(PlusSignIcon)
export const Trash = createIcon(Delete02Icon)
export const Edit = createIcon(Edit02Icon)
export const ArrowRight = createIcon(ArrowRight01Icon)
export const ArrowLeft = createIcon(ArrowLeft01Icon)
export const Eye = createIcon(ViewIcon)
export const EyeOff = createIcon(ViewOffSlashIcon)
export const Spinner = createIcon(Loading03Icon)
export const Globe = createIcon(Globe02Icon)
export const Info = createIcon(InformationCircleIcon)
