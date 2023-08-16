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
		contentEl.createEl("h1", { text: "Publishing..." })
			.setCssStyles({
				marginBlockStart: '0',
			})

		this.progress = contentEl.createEl('progress')
		this.progress.max = 100
		this.progress.setCssStyles({
			width: '100%',
		})

		this.description = contentEl.createEl('p')
		this.description.setCssStyles({
			width: '100%',
		})
	}

	setProgress(progress: PublishingProgressItem) {
		this.progress.value = progress.progress
		if (progress.filename) {
			this.description.innerText = `Uploading "${progress.filename}"`
		} else {
			this.description.innerText = 'Preparing files'
		}
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
