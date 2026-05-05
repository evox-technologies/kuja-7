'use client'

import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const toggleGroupVariants = cva(
  'flex items-center rounded-full bg-gray-100 p-0.5 text-xs',
  {
    variants: {
      size: {
        default: 'text-xs',
        sm: 'text-[11px]',
      },
    },
    defaultVariants: { size: 'default' },
  }
)

const toggleItemVariants = cva(
  'px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer select-none focus:outline-none',
  {
    variants: {
      state: {
        on: 'bg-white shadow-sm text-gray-800',
        off: 'text-gray-400 hover:text-gray-600',
      },
    },
    defaultVariants: { state: 'off' },
  }
)

type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleGroupVariants>

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(toggleGroupVariants({ size }), className)}
    {...props}
  >
    {children}
  </ToggleGroupPrimitive.Root>
))
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      toggleItemVariants(),
      'data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-gray-800 data-[state=off]:text-gray-400',
      className
    )}
    {...props}
  >
    {children}
  </ToggleGroupPrimitive.Item>
))
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
