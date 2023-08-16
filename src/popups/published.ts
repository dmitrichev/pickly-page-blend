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
		contentEl.createEl("h1", { text: "The page was published" })
			.setCssStyles({
				marginBlockStart: '0',
			})

		contentEl.createEl('input', {value: this.response.url, type: 'text'}, elm => {
			elm.select()
		})
			.setCssStyles({
				width: '100%',
				marginBottom: '20px',
			})

		new Setting(contentEl)
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
