import { Dialog, DialogTitle, DialogContent, Button } from "@mui/material";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";

export default function PostEditor({
  open,
  onClose,
  content,
  setContent,
  setImage,
  handleSubmit,
}) {
  const editor = useEditor({
    extensions: [StarterKit, Link],
    content,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Create New Post</DialogTitle>
      <DialogContent>
        <RichTextEditor editor={editor}>
          <RichTextEditor.Toolbar sticky>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Link />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>
          <RichTextEditor.Content />
        </RichTextEditor>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          style={{ marginTop: "1rem" }}
        />
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleSubmit}>
          Submit Post
        </Button>
      </DialogContent>
    </Dialog>
  );
}
