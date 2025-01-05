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
        getAttrs: (dom) => {
          const container = (dom as HTMLElement).querySelector('.image-container');
          return {
            src: container?.querySelector('img')?.getAttribute('src'),
            width: (container as HTMLElement)?.style.width
          };
        }
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-resizable-image-wrapper': '' }), 
      ['div', { class: 'image-container', style: `width: ${HTMLAttributes.width};` }, [
        ['img', { src: HTMLAttributes.src }],
        ['div', { class: 'resize-handles' }, [
          ['div', { class: 'resize-handle resize-handle-left' }],
          ['div', { class: 'resize-handle resize-handle-right' }]
        ]]
      ]]
    ];
  },

  addNodeView() {
    return ({ node, editor }) => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-resizable-image-wrapper', '');

      const container = document.createElement('div');
      container.className = 'image-container';
      container.style.width = node.attrs.width;

      const img = document.createElement('img');
      img.src = node.attrs.src;

      const resizeHandles = document.createElement('div');
      resizeHandles.className = 'resize-handles';

      const resizeHandleLeft = document.createElement('div');
      resizeHandleLeft.className = 'resize-handle resize-handle-left';

      const resizeHandleRight = document.createElement('div');
      resizeHandleRight.className = 'resize-handle resize-handle-right';

      resizeHandles.appendChild(resizeHandleLeft);
      resizeHandles.appendChild(resizeHandleRight);
      container.appendChild(img);
      container.appendChild(resizeHandles);
      wrapper.appendChild(container);

      let resizing = false;
      let startX: number;
      let startWidth: number;

      const handlePointerDown = (event: PointerEvent, direction: string) => {
        event.preventDefault();
        wrapper.setAttribute('data-resizing', 'true');
        startX = event.clientX;
        startWidth = parseInt(container.style.width, 10);
        resizing = true;

        const onPointerMove = (e: PointerEvent) => handlePointerMove(e, direction);
        const onPointerUp = () => {
          resizing = false;
          wrapper.removeAttribute('data-resizing');
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
      };

      const handlePointerMove = (event: PointerEvent, direction: string) => {
        if (!resizing) return;

        const deltaX = event.clientX - startX;
        const newWidth = direction === 'right'
          ? startWidth + (deltaX / wrapper.offsetWidth) * 100
          : startWidth - (deltaX / wrapper.offsetWidth) * 100;

        const limitedWidth = Math.min(Math.max(newWidth, 10), 100);
        container.style.width = `${limitedWidth}%`;

        editor.commands.updateAttributes('resizableImage', {
          width: `${limitedWidth}%`,
        });
      };

      const handlePointerDownLeft = (e: PointerEvent) => handlePointerDown(e, 'left');
      const handlePointerDownRight = (e: PointerEvent) => handlePointerDown(e, 'right');

      resizeHandleLeft.addEventListener('pointerdown', handlePointerDownLeft);
      resizeHandleRight.addEventListener('pointerdown', handlePointerDownRight);

      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          img.src = updatedNode.attrs.src;
          container.style.width = updatedNode.attrs.width;
          return true;
        },
        destroy() {
          resizeHandleLeft.removeEventListener('pointerdown', handlePointerDownLeft);
          resizeHandleRight.removeEventListener('pointerdown', handlePointerDownRight);
        },
      };
    };
  },
});

export default ResizableImage;
