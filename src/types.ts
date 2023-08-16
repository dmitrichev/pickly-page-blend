export type PublishResponse = {
	id: string,
	url: string,
}

export type PicklyItem = {
	id: string
}

export interface PicklyPluginSettings {
	items: Map<string, PicklyItem>
}

export type PublishingProgressItem = {
	progress: number;
	filename: string;
}
export type PublishingCallback = (progress: PublishingProgressItem) => void
