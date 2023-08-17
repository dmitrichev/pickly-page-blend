import {App, TFile} from "obsidian";
import {PicklyPluginSettings, PublishingCallback, PublishResponse} from "./types";

export class Publisher {
	private readonly apiBaseUrl = 'https://pb.pickly.space/api'
	private readonly basePath = '/pages'

	private readonly imgExtensions = [
		'jpg', 'jpeg', 'bmp', 'ico', 'png', 'gif', 'webp', 'tiff', 'svg',
	]

	private readonly insertRegExp = new RegExp(/(\!)?\[\[.+\]\]/g)
	private readonly linksRegExp = new RegExp(/\[.+\]\(.+\)/g)

	private filesNeedUpload: { [key: string]: TFile } = {}

	private files: TFile[]

	constructor(
		private app: App,
		private settings: PicklyPluginSettings,
	) {
	}

	async publish(file: TFile, callback: PublishingCallback) {
		this.files = this.app.vault.getFiles()
		await this.findFilesForUpload(file)
		const total = Object.keys(this.filesNeedUpload).length
		delete this.filesNeedUpload[file.path]
		let i = 0;
		for (let key in this.filesNeedUpload) {
			callback({
				progress: Math.round(i / total * 100),
				filename: this.filesNeedUpload[key].path,
			})
			await this.uploadFile(this.filesNeedUpload[key])
			i++
		}
		callback({
			progress: 100,
			filename: file.path,
		})
		return await this.uploadFile(file)
	}

	async uploadFile(file: TFile): Promise<PublishResponse> {
		let fileData: ArrayBuffer
		if (file.extension === 'md') {
			let data = await this.app.vault.read(file)
			data = this.replaceLinks(data)
			const enc = new TextEncoder()
			fileData = enc.encode(data)
		} else {
			fileData = await this.app.vault.readBinary(file)
		}
		const formData = new FormData()
		const blob = new Blob([fileData], {type: "text/text"})
		formData.append('title', decodeURI(file.name))
		formData.append('file', blob)
		const fileItem = this.settings.items.get(file.path)
		if (fileItem) {
			const suffix = file.extension === 'md' ? 'html' : file.extension;
			formData.append('id', `${fileItem.id}.${suffix}`)
		}

		const resp = await fetch(`${this.apiBaseUrl}/publish`, {
			method: 'POST',
			body: formData,
		})
		const data: PublishResponse = await resp.json()
		return Promise.resolve(data)
	}

	async findFilesForUpload(file: TFile) {
		if (!this.filesNeedUpload[file.path]) {
			this.filesNeedUpload[file.path] = file
			if (file.extension === 'md') {
				let data = await this.app.vault.read(file)
				const inserts = data.match(this.insertRegExp)
				if (inserts) {
					for (let idx in inserts) {
						const filename = inserts[idx].startsWith('[[')
							? inserts[idx].substring(2, inserts[idx].length - 2)
							: inserts[idx].substring(3, inserts[idx].length - 2)
						const fl = this.findFile(filename)
						if (fl) {
							await this.findFilesForUpload(fl)
						}
					}
				}
				const links = data.match(this.linksRegExp)
				if (links) {
					for (let idx in links) {
						const filename = links[idx].substring(links[idx].indexOf('(') + 1, links[idx].length - 1)
						const fl = this.findFile(filename)
						if (fl) {
							await this.findFilesForUpload(fl)
						}
					}
				}
			}
		}
		return
	}

	findFile(name: string): TFile | null {
		name = decodeURI(name)
		const filtered = this.files.filter(file => file.path.indexOf(name) > -1)
		if (filtered.length === 1) {
			return filtered[0]
		}
		return null
	}

	replaceLinks(data: string): string {
		const inserts = data.match(this.insertRegExp)
		if (inserts) {
			for (let idx in inserts) {
				const filename = inserts[idx].startsWith('[[')
					? inserts[idx].substring(2, inserts[idx].length - 2)
					: inserts[idx].substring(3, inserts[idx].length - 2)
				const insertedFile = this.findFile(filename)
				if (insertedFile) {
					const fileItem = this.settings.items.get(insertedFile.path)
					if (fileItem) {
						let suffix = insertedFile.extension
						if (suffix === 'md') {
							suffix = 'html'
						}

						if (this.imgExtensions.indexOf(insertedFile.extension) > -1) {
							data = data.replace(
								inserts[idx],
								`![${insertedFile.name.substring(0, insertedFile.name.lastIndexOf('.') ?? -1)}](${this.basePath}/${fileItem.id}.${suffix})`
							)
						} else {
							data = data.replace(
								inserts[idx],
								`[${insertedFile.name.substring(0, insertedFile.name.lastIndexOf('.') ?? -1)}](${this.basePath}/${fileItem.id}.${suffix})`
							)
						}
					}
				}
			}
		}

		const links = data.match(this.linksRegExp)
		if (links) {
			for (let idx in links) {
				const filename = links[idx].substring(links[idx].indexOf('(') + 1, links[idx].length - 1)
				const linkedFile = this.findFile(filename)
				if (linkedFile) {
					const fileItem = this.settings.items.get(linkedFile.path)
					if (fileItem) {
						let suffix = linkedFile.extension
						if (suffix === 'md') {
							suffix = 'html'
						}
						data = data.replace(
							filename,
							`${this.basePath}/${fileItem.id}.${suffix}`
						)
					}
				}
			}
		}

		return data
	}
}
