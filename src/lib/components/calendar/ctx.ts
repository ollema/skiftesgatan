import {
	createCalendar,
	type Calendar as CalendarReturn,
	type CreateCalendarProps
} from '@melt-ui/svelte';
import { getContext, setContext } from 'svelte';
import type { StoresValues, Writable } from 'svelte/store';

function removeUndefined<T extends object>(obj: T): T {
	const result = {} as T;
	for (const key in obj) {
		const value = obj[key];
		if (value !== undefined) {
			result[key] = value;
		}
	}
	return result;
}

type Options = Record<string, Writable<unknown>>;

function getOptionUpdater(options: Options) {
	return function <
		K extends keyof typeof options,
		V extends StoresValues<(typeof options)[keyof typeof options]>
	>(key: K, value: V | undefined) {
		if (value === undefined) return;
		const store = options[key];
		if (store) {
			store.set(value as never);
		}
	};
}

const bits = [
	'accordion',
	'alert-dialog',
	'aspect-ratio',
	'avatar',
	'button',
	'checkbox',
	'collapsible',
	'context-menu',
	'calendar',
	'dialog',
	'dropdown-menu',
	'link-preview',
	'label',
	'menubar',
	'popover',
	'progress',
	'radio-group',
	'select',
	'separator',
	'slider',
	'switch',
	'tabs',
	'toggle',
	'toggle-group',
	'tooltip'
] as const;

type Bit = (typeof bits)[number];

export function createBitAttrs<T extends readonly string[]>(bit: Bit, parts: T) {
	const attrs: Record<string, Record<string, string>> = {};
	parts.forEach((part) => {
		attrs[part] = {
			[`data-bits-${bit}-${part}`]: ''
		};
	});

	return (part: T[number]) => attrs[part];
}

export function disabledAttrs(disabled: boolean | undefined | null) {
	return disabled ? { 'aria-disabled': true, 'data-disabled': '' } : {};
}

const NAME = 'calendar';
const PARTS = [
	'root',
	'prev-button',
	'next-button',
	'heading',
	'grid',
	'date',
	'header',
	'grid-head',
	'grid-head-cell',
	'grid-body',
	'grid-body-cell',
	'grid-row'
] as const;

export const getAttrs = createBitAttrs(NAME, PARTS);

type GetReturn = CalendarReturn;

export function setCtx(props: CreateCalendarProps) {
	const calendar = createCalendar(removeUndefined(props));
	setContext(NAME, calendar);
	return {
		...calendar,
		updateOption: getOptionUpdater(calendar.options)
	};
}

export function getCtx() {
	return getContext<GetReturn>(NAME);
}
