import * as $ from 'jquery';
import 'jquery-contextmenu';

export interface IAttribute {
	name: string;
	value: any;
}

export default class DOMUtils {
	static addSVGElement(tagName: string, parent: Document = document, ...attributes: IAttribute[]): SVGElement {
		let element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
		
		attributes.forEach(attr => {
			let namespace = attr.name === 'href' ? 'http://www.w3.org/1999/xlink' : null;
			element.setAttributeNS(namespace, attr.name, attr.value);
		});

		return parent.appendChild(element);
	}

	static removeElement(elementId: string, parent: Document = document): void {
		let element = parent.getElementById(elementId);
		element.parentElement.removeChild(element);
	}

	static removeContextMenu(elementId: string): void {
		($(`[id='${elementId}']`) as any).contextMenu('destroy');
	}
}
