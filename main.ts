import {Editor, MarkdownView, Menu, Notice, Plugin, TAbstractFile, TFile} from 'obsidian'
import {PicklyPluginSettings, PicklyItem} from './src/types'
import {Publisher} from "./src/publisher"
import {PublishSuccessModal} from "./src/popups/published";
import {PublishingModal} from "./src/popups/piblushing";

export default class PicklyPageBlendPlugin extends Plugin {
	private settings: PicklyPluginSettings
	private publisher: Publisher

	async onload() {
		await this.loadSettings()
		this.publisher = new Publisher(this.app, this.settings)
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TAbstractFile) => {
				this.addItem(menu, file)
			})
		)

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor, view: MarkdownView) => {
				this.addItem(menu, view.file)
			})
		)

		this.addCommand({
			id: "pickly-page-blend",
			name: "Publish with PageBlend",
			hotkeys: [
				{
					modifiers: ['Mod', 'Shift'],
					key: 'p',
				}
			],
			callback: async () => {
				const file = this.app.workspace.activeEditor?.file
				if (file) {
					await this.publish(file)
				} else {
					new Notice("There is no file for publish")
				}
			},
		})

		this.registerEvent(this.app.vault.on('delete', file => {
			this.settings.publishedFiles.delete(file.path)
			this.saveSettings()
		}))

		this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
			const oldItem = this.settings.publishedFiles.get(oldPath)
			if (oldItem) {
				this.settings.publishedFiles.set(file.path, {
					id: oldItem.id
				})
			}
			this.saveSettings()
		}))
	}

	addItem(menu: Menu, file: TAbstractFile | null) {
		if (file !== null && file instanceof TFile) {
			menu.addItem((item) => {
				item
					.setTitle("Publish with PageBlend")
					.setIcon('publish')
					.onClick(async () => {
						await this.publish(file)
					})
			})
		}
	}

	async publish(file: TFile) {
		const modal = new PublishingModal(this.app)
		modal.open()
		try {
			const resp = await this.publisher.publish(
				file,
				item => modal.setProgress(item),
			)

			new PublishSuccessModal(this.app, resp).open()
		} catch (e) {
			new Notice("Something went wrong...")
			console.error(e)
		} finally {
			modal.setCanClose(true)
			modal.close()
			await this.saveSettings()
		}
	}

	async loadSettings() {
		this.settings = {
			publishedFiles: new Map<string, PicklyItem>()
		}
		const data = await this.loadData()
		if (data.publishedFiles) {
			Object.keys(data.publishedFiles).forEach(key => {
				if (data.publishedFiles[key].id) {
					this.settings.publishedFiles.set(key, {
						id: data.publishedFiles[key].id
					})
				}
			})
		}
	}

	async saveSettings() {
		const settings: { publishedFiles: { [key: string]: PicklyItem } } = {publishedFiles: {}}
		this.settings.publishedFiles.forEach((val, key) => {
			settings.publishedFiles[key] = val
		})
		await this.saveData(settings)
	}
}
