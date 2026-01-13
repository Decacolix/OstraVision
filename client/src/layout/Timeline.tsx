import { useMemo } from 'react';

/* Component props: timeline (timeline string, format: year:event;year:event;year:event; ...). */
type Props = {
	timeline?: string | null;
};

/* Parsed timeline item shape used internally by the component. */
type TimelineItem = {
	year: number;
	event: string;
};

/* CSS classes for a standard timeline item (multiple items present). */
const ITEM_CLASS: string =
	"py-4 pl-6 border-l-4 border-olb before:content-[' '] before:h-6 before:w-6 before:bg-white before:absolute before:right-full before:translate-x-[calc(50%+2px)] before:border-4 before:border-olb before:rounded-full";

/* CSS classes for a single timeline item. */
const ITEM_CLASS_SINGLE: string =
	"py-4 pl-6 before:content-[' '] before:h-6 before:w-6 before:bg-white before:absolute before:right-full before:translate-x-[calc(50%+2px)] before:border-4 before:border-olb before:rounded-full";

/* Timeline component: shows a vertical timeline. */
const Timeline = ({ timeline }: Props) => {
	/* Parse and normalize the timeline string, useMemo prevents unnecessary recalculations. */
	const items = useMemo<TimelineItem[] | null>(() => {
		/* Timeline must be a valid string. */
		if (typeof timeline !== 'string') return null;

		const raw: string = timeline.trim();
		if (!raw) return null;

		/* Split by semicolon into individual timeline entries. */
		const parts: string[] = raw
			.split(';')
			.map(part => part.trim())
			.filter(Boolean);
		if (parts.length === 0) return null;

		const parsed: TimelineItem[] = [];

		/* Parse each "<year>:<event>" pair safely. */
		for (const part of parts) {
			const colonIdx: number = part.indexOf(':');
			if (colonIdx <= 0) continue;

			const yearString: string = part.slice(0, colonIdx).trim();
			const eventString: string = part.slice(colonIdx + 1).trim();

			const year: number = Number(yearString);

			/* Validate year and event text. */
			if (!Number.isFinite(year) || yearString.length < 4) continue;
			if (!eventString) continue;

			parsed.push({ year, event: eventString });
		}

		if (parsed.length === 0) return null;

		/* Sort from newest to oldest year. */
		parsed.sort((a, b) => b.year - a.year);

		return parsed;
	}, [timeline]);

	/* If no valid timeline data exists, render nothing. */
	if (!items) return null;

	return (
		<div>
			<ul className="relative ml-2">
				{items.map((item, idx) => (
					<li
						key={`${item.year}-${idx}`}
						/* Use different styling if only one timeline item exists. */
						className={items.length > 1 ? ITEM_CLASS : ITEM_CLASS_SINGLE}
					>
						<h3 className="font-bold text-md">{item.year}</h3>
						<h4 className="wrap-anywhere">{item.event}</h4>
					</li>
				))}
			</ul>
		</div>
	);
};

export default Timeline;
