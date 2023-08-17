import {App, Modal, Notice, Setting} from "obsidian";
import {PublishResponse} from "../types";

export class PublishSuccessModal extends Modal {
	private response: PublishResponse
	constructor(app: App, resp: PublishResponse) {
		super(app)
		this.response = resp
	}

	onOpen() {
		let { contentEl } = this
		contentEl.addClass('pickly-modal')
		contentEl.createEl("h1", { text: "The note was published" })

		contentEl.createEl('input', {value: this.response.url, type: 'text'}, elm => {
			elm.select()
		})

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Open")
					.onClick(async () => {
						const link = contentEl.createEl('a', {cls: 'hidden', href: this.response.url})
						link.click()
					}))
			.addButton((btn) =>
				btn
					.setButtonText("Copy")
					.setCta()
					.onClick(async () => {
						await navigator.clipboard.writeText(this.response.url)
						new Notice("Link was copied")
						this.close()
					}))
	}

	onClose() {
		let { contentEl } = this
		contentEl.empty()
	}
}
