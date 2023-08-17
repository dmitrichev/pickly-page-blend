import {App, Modal} from "obsidian";
import {PublishingProgressItem} from "../types";

export class PublishingModal extends Modal {
	private progress: HTMLProgressElement
	private description: HTMLParagraphElement

	private canClose: boolean = false;

	constructor(app: App) {
		super(app)
	}

	onOpen() {
		let { contentEl } = this
		contentEl.addClass('pickly-modal')
		contentEl.createEl("h1", { text: "Publishing..." })

		this.progress = contentEl.createEl('progress')
		this.progress.max = 100

		this.description = contentEl.createEl('p', {text: "Preparing files..."})
	}

	setProgress(progress: PublishingProgressItem) {
		this.progress.value = progress.progress
		this.description.innerText = `Uploading "${progress.filename}"`
	}

	setCanClose(val: boolean) {
		this.canClose = val
	}

	close() {
		if (this.canClose) {
			super.close();
		}
	}

	onClose() {
		let { contentEl } = this
		contentEl.empty()
	}
}
