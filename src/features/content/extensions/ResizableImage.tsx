import { Node } from '@tiptap/core';

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
    return [{
      tag: 'div[data-resizable-image]',
      getAttrs: (dom) => ({
        src: (dom as HTMLElement).querySelector('img')?.getAttribute('src'),
        width: (dom as HTMLElement).querySelector('.image-container')?.getAttribute('style')?.match(/width:\s*([\d.]+%)/)?.[1],
      }),
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 'data-resizable-image': '' },
      [
        'div',
        { class: 'image-container', style: `width: ${HTMLAttributes.width}` },
        [
          'img',
          { src: HTMLAttributes.src },
        ],
        [
          'div',
          { class: 'resize-handles' },
          ['div', { class: 'resize-handle resize-handle-left' }],
          ['div', { class: 'resize-handle resize-handle-right' }],
        ],
      ],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      if (typeof getPos !== 'function') {
        return {
          dom: document.createElement('div'),
          update: () => false,
          destroy: () => {},
        };
      }
      
      const container = document.createElement('div');
      container.setAttribute('data-resizable-image', '');
      
      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';
      imageContainer.style.width = node.attrs.width;

      const img = document.createElement('img');
      img.src = node.attrs.src;

      const handles = document.createElement('div');
      handles.className = 'resize-handles';

      const leftHandle = document.createElement('div');
      leftHandle.className = 'resize-handle resize-handle-left';

      const rightHandle = document.createElement('div');
      rightHandle.className = 'resize-handle resize-handle-right';

      handles.appendChild(leftHandle);
      handles.appendChild(rightHandle);
      imageContainer.appendChild(img);
      imageContainer.appendChild(handles);
      container.appendChild(imageContainer);

      let resizing = false;
      let startX = 0;
      let startWidth = 0;

      const handleResize = (e: PointerEvent, direction: 'left' | 'right') => {
        if (!resizing) return;
        
        const delta = e.clientX - startX;
        const newWidth = direction === 'right'
          ? startWidth + (delta / container.offsetWidth) * 100
          : startWidth - (delta / container.offsetWidth) * 100;

        const width = `${Math.min(Math.max(newWidth, 10), 100)}%`;
        imageContainer.style.width = width;
      };

      const handlePointerUp = () => {
        if (!resizing) return;
        resizing = false;
        
        const pos = getPos();
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          width: imageContainer.style.width,
        });
        editor.view.dispatch(tr);
      };

      const handlePointerDown = (e: PointerEvent, direction: 'left' | 'right') => {
        resizing = true;
        startX = e.clientX;
        startWidth = parseFloat(imageContainer.style.width);
        e.preventDefault();
        
        const onMove = (e: PointerEvent) => handleResize(e, direction);
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', () => {
          document.removeEventListener('pointermove', onMove);
          handlePointerUp();
        }, { once: true });
      };

      leftHandle.addEventListener('pointerdown', (e) => handlePointerDown(e, 'left'));
      rightHandle.addEventListener('pointerdown', (e) => handlePointerDown(e, 'right'));

      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          if (img.src !== updatedNode.attrs.src) {
            img.src = updatedNode.attrs.src;
          }
          if (imageContainer.style.width !== updatedNode.attrs.width) {
            imageContainer.style.width = updatedNode.attrs.width;
          }
          return true;
        },
        destroy() {
          leftHandle.removeEventListener('pointerdown', (e) => handlePointerDown(e, 'left'));
          rightHandle.removeEventListener('pointerdown', (e) => handlePointerDown(e, 'right'));
        }
      };
    };
  },
});

export default ResizableImage;
