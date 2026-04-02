<?php

namespace App\Enums;

enum ProjectSubStatus: string
{
    case DRAFT            = 'draft';
    case FOR_REVISION     = 'for_revision';
    case PENDING_APPROVAL = 'pending_approval';
    case APPROVED         = 'approved';

    /**
     * User-friendly display label.
     */
    public function label(): string
    {
        return match ($this) {
            self::DRAFT            => 'Draft',
            self::FOR_REVISION     => 'For Revision',
            self::PENDING_APPROVAL => 'Pending Approval',
            self::APPROVED         => 'Approved',
        };
    }

    /**
     * Tailwind badge color classes.
     */
    public function badgeColor(): string
    {
        return match ($this) {
            self::DRAFT            => 'bg-gray-100 text-gray-700',
            self::FOR_REVISION     => 'bg-red-100 text-red-600',
            self::PENDING_APPROVAL => 'bg-orange-100 text-orange-600',
            self::APPROVED         => 'bg-green-100 text-green-700',
        };
    }

    /**
     * All sub-statuses as an array for validation rules.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
