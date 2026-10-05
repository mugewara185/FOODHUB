import os
import re

def fix_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# AdminLayout.tsx
fix_file('web/src/shared/layout/AdminLayout.tsx', [
    ('Badge,', ''),
    ('Notifications,', ''),
    ('DeliveryDining,', ''),
    ('Category,', ''),
    ('Receipt,', ''),
    ('BarChart,', '')
])

# ProfileCard.tsx
fix_file('web/src/shared/components/ui/ProfileCard/ProfileCard.tsx', [
    ('<Grid item', '<Grid'),
    ('button\n            onClick', 'onClick'),
    ('button onClick', 'onClick'),
])

# MainLayout.tsx
fix_file('web/src/shared/layout/MainLayout.tsx', [
    ('Container,', ''),
    ('ListItem,', ''),
    ('CircularProgress,', ''),
    ('const dispatch = useAppDispatch();', ''),
    ('import { useAppDispatch, useAppSelector } from \'@/app/store/hooks\';', 'import { useAppSelector } from \'@/app/store/hooks\';'),
    ('const { user, isLoading } = useAppSelector((state) => state.auth);', 'const { user } = useAppSelector((state) => state.auth);')
])

# UserLayout.tsx
fix_file('web/src/shared/layout/UserLayout.tsx', [
    ('Container,', ''),
    ('Drawer,', ''),
    ('ListItem,', ''),
    ('CircularProgress,', ''),
    ('Fade,', ''),
    ('Zoom,', ''),
    ('Menu as MenuIcon,', ''),
    ('Dashboard,', ''),
    ('Star,', ''),
    ('SupportAgent,', ''),
    ('const dispatch = useAppDispatch();', ''),
    ('import { useAppDispatch, useAppSelector } from \'@/app/store/hooks\';', 'import { useAppSelector } from \'@/app/store/hooks\';'),
    ('const { user, isLoading } = useAppSelector((state) => state.auth);', 'const { user } = useAppSelector((state) => state.auth);')
])

# LocationPicker.tsx
fix_file('web/src/shared/components/maps/LocationPicker.tsx', [
    ('CircularProgress,', ''),
    ('MyLocation,', ''),
    ('import type { Location } from \'../../../data/types/location\';', ''),
    ('const { loading } = useAppSelector((state) => state.location);', '')
])

# Map.tsx
fix_file('web/src/shared/components/maps/Map.tsx', [
    ('import type { MapMarker } from \'../../../data/types/location\';', ''),
    ('polylines,', '')
])

# StaticMap.tsx
fix_file('web/src/shared/components/maps/StaticMap.tsx', [
    ('import { LocationOn } from \'@mui/icons-material\';\n', ''),
    ('// If it was missing:', 'import { LocationOn } from \'@mui/icons-material\';\n')
])
with open('web/src/shared/components/maps/StaticMap.tsx', 'r') as f:
    c = f.read()
if 'import { LocationOn }' not in c:
    c = "import { LocationOn } from '@mui/icons-material';\n" + c
with open('web/src/shared/components/maps/StaticMap.tsx', 'w') as f:
    f.write(c)

# ErrorState.tsx
fix_file('web/src/shared/components/ui/AsyncState/ErrorState.tsx', [
    ('Box,', '')
])

# CourseCard.tsx
fix_file('web/src/shared/components/ui/CourseCard.tsx', [
    ('import type { Course } from \'../../../data/types\';', '')
])

# SkeletonGrid.tsx
fix_file('web/src/shared/components/ui/SkeletonGrid/SkeletonGrid.tsx', [
    ('Box,', ''),
    ('<Grid item', '<Grid')
])

# Header.tsx
fix_file('web/src/shared/layout/others/Header.tsx', [
    ('import { useAppSelector, useAppDispatch } from \'../hooks\';', 'import { useAppSelector, useAppDispatch } from \'@/app/store/hooks\';')
])

print("Fixed UI components")
