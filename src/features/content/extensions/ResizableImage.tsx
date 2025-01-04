import { Node, mergeAttributes } from '@tiptap/core';

const ResizableImage = Node.create({
  name: 'resizableImage',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '60%',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-resizable-image-wrapper]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-resizable-image-wrapper': '' }), ['img', { src: HTMLAttributes.src, style: `width: ${HTMLAttributes.width};` }]];
  },

  addNodeView() {
    return ({ node, editor }) => {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.setAttribute('data-resizable-image-wrapper', '');

      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.style.width = node.attrs.width;
      img.style.display = 'block';

      const resizeHandle = document.createElement('div');
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.bottom = '0';
      resizeHandle.style.right = '0';
      resizeHandle.style.width = '10px';
      resizeHandle.style.height = '10px';
      resizeHandle.style.backgroundColor = 'gray';
      resizeHandle.style.cursor = 'se-resize';

      wrapper.appendChild(img);
      wrapper.appendChild(resizeHandle);

      let resizing = false;
      let startX: number;
      let startWidth: number;

      const handlePointerDown = (event: PointerEvent) => {
        startX = event.clientX;
        startWidth = parseInt(node.attrs.width, 10);
        resizing = true;
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
      };

      const handlePointerMove = (event: PointerEvent) => {
        if (!resizing) return;

        const deltaX = event.clientX - startX;
        const newWidth = startWidth + (deltaX / wrapper.offsetWidth) * 100;

        if (newWidth >= 20 && newWidth <= 80) {
          editor.commands.updateAttributes('resizableImage', { width: `${newWidth}%` });
        }
      };

      const handlePointerUp = () => {
        resizing = false;
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };

      resizeHandle.addEventListener('pointerdown', handlePointerDown);

      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false;
          }
          img.src = updatedNode.attrs.src;
          img.style.width = updatedNode.attrs.width;
          return true;
        },
        destroy() {
          resizeHandle.removeEventListener('pointerdown', handlePointerDown);
        },
      };
    };
  },
});

export default ResizableImage;
