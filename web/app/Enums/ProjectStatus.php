<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case PROPOSED  = 'proposed';
    case ONGOING   = 'ongoing';
    case COMPLETED = 'completed';

    /**
     * User-friendly display label for frontend badges.
     */
    public function label(): string
    {
        return match ($this) {
            self::PROPOSED  => 'Proposed',
            self::ONGOING   => 'Ongoing',
            self::COMPLETED => 'Completed',
        };
    }

    /**
     * Badge display label (shorter, for compact badges).
     */
    public function badgeLabel(): string
    {
        return match ($this) {
            self::PROPOSED  => 'Proposed',
            self::ONGOING   => 'Ongoing',
            self::COMPLETED => 'Completed',
        };
    }

    /**
     * Tailwind badge color classes.
     */
    public function badgeColor(): string
    {
        return match ($this) {
            self::PROPOSED  => 'bg-blue-100 text-blue-700',
            self::ONGOING   => 'bg-green-100 text-green-700',
            self::COMPLETED => 'bg-emerald-100 text-emerald-700',
        };
    }

    /**
     * Whether the project can be edited (by Sales).
     * This now will be determined by sub_status if status is PROPOSED.
     */
    public function isEditable(): bool
    {
        return $this === self::PROPOSED;
    }

    /**
     * All statuses as an array for validation rules.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
