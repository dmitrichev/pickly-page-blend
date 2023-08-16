import {Editor, MarkdownView, Menu, Notice, Plugin, TAbstractFile, TFile} from 'obsidian'
import {PicklyPluginSettings, PicklyItem} from './src/types'
import {Publisher} from "./src/publisher"
import {v4 as uuidv4} from "uuid"
import {PublishSuccessModal} from "./src/popups/published";
import {PublishingModal} from "./src/popups/piblushing";

export default class MyPlugin extends Plugin {
	private settings: PicklyPluginSettings
	private publisher: Publisher

	async onload() {
		await this.loadSettings()
		await this.install()
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
			name: "Publish with Page Blend",
			callback: async () => {
				const file = this.app.workspace.activeEditor?.file
				if (file) {
					await this.publish(file)
				} else {
					new Notice("There is no file for publish")
				}
			},
		})

		this.registerEvent(this.app.vault.on('create', file => {
			this.settings.items.set(file.path, {
				id: uuidv4()
			})
			this.saveSettings()
		}))

		this.registerEvent(this.app.vault.on('delete', file => {
			this.settings.items.delete(file.path)
			this.saveSettings()
		}))

		this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
			const oldItem = this.settings.items.get(oldPath)
			if (oldItem) {
				this.settings.items.set(file.path, {
					id: oldItem.id
				})
			} else {
				this.settings.items.set(file.path, {
					id: uuidv4()
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
		}
	}

	async install() {
		this.app.vault.getFiles().forEach(file => {
			if (!this.settings.items.has(file.path)) {
				this.settings.items.set(file.path, {
					id: uuidv4()
				})
			}
		})
		await this.saveSettings()
	}

	async loadSettings() {
		this.settings = {
			items: new Map<string, PicklyItem>()
		}
		const data = await this.loadData()
		if (data) {
			Object.keys(data).forEach(key => {
				if (!data[key].id) {
					data[key].id = uuidv4()
				}
				this.settings.items.set(key, {
					id: data[key].id
				})
			})
		}
	}

	async saveSettings() {
		const settings: { [key: string]: PicklyItem } = {}
		this.settings.items.forEach((val, key) => {
			settings[key] = val
		})
		await this.saveData(settings)
	}
}
