import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const Editor: React.FC<{ initialContent: string }> = ({ initialContent }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
  });

  return (
    <div className="editor">
      <EditorContent editor={editor} />
    </div>
  );
};

export default Editor;
