import { Dialog, DialogTitle, DialogContent, Button } from "@mui/material";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { TextField, Typography } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import React, { use, useEffect, useState } from "react";

export default function PostEditor({
  open,
  onClose,
  content,
  setContent,
  setImage,
  handleSubmit,
}) {
  const [selectedPromotion, setSelectedPromotion] = React.useState("");
  const [eventName, setEventName] = React.useState("");
  const [discount, setDiscount] = React.useState(false);
  const [discountAmount, setDiscountAmount] = React.useState("");
  const [discountText, setDiscountText] = React.useState("");
  const [releaseDate, setReleaseDate] = React.useState("");
  const promotion = [
    "Reservations",
    "Featured Dish",
    "Featured Drink",
    "Dessert Special",
    "Event / Entertainment Night",
    "Happy Hour",
    "Brunch",
    "Catering Service",
    "Customer Win-Back",
    "New Menu Item",
    "Seasonal / Holiday Special",
    "Loyalty / VIP Message",
  ];

  useEffect(() => {
    setContent({
      selectedPromotion,
      eventName,
      discount,
      discountAmount,
      discountText,
      releaseDate,
    });
  }, [
    selectedPromotion,
    eventName,
    discount,
    discountAmount,
    discountText,
    releaseDate,
  ]);

  const editor = useEditor({
    extensions: [StarterKit, Link],
    content,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Create New Post</DialogTitle>
      <DialogContent>
        {/* <RichTextEditor editor={editor}>
          <RichTextEditor.Toolbar sticky>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Link />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>
          <RichTextEditor.Content />
        </RichTextEditor> */}
        <FormControl>
          <FormLabel id="Promotion-Select">
            What would you like to promote? (Choose one)
          </FormLabel>
          <RadioGroup
            aria-labelledby="Promotion-Select-group-label"
            name="Promotion-Select-group"
            onChange={(e) => setSelectedPromotion(e.target.value)}
          >
            {promotion.map((item) => (
              // <MenuItem key={item} value={item}>
              //   {item}
              // </MenuItem>
              <FormControlLabel value={item} control={<Radio />} label={item} />
            ))}
          </RadioGroup>
        </FormControl>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          Item or Event Name
        </Typography>
        <TextField
          fullWidth
          placeholder="Enter the item or event you want to promote"
          helperText="Example: Honey Garlic Wings / Karaoke Night"
          variant="outlined"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />
        <FormControl>
          <FormLabel id="Discount-Select">
            Would you like to include a discount?
          </FormLabel>
          <RadioGroup
            aria-labelledby="Discount-Select-label"
            name="Discount-Select"
            onChange={(e) => {
              setDiscount(e.target.value);
              setDiscountAmount("");
            }}
          >
            <FormControlLabel value={true} control={<Radio />} label="Yes" />
            <FormControlLabel value="" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>
        {discount && (
          <FormControl>
            <FormLabel id="Discount-Amount">
              {" "}
              What discount would you like to offer?
            </FormLabel>
            <RadioGroup
              aria-labelledby="Discount-Amount-label"
              name="Discount-Amount"
              onChange={(e) => {
                setDiscountAmount(e.target.value);
                setDiscountText("");
              }}
            >
              <FormControlLabel
                value="Percentage Off"
                control={<Radio />}
                label={
                  <>
                    Percentage Off:
                    {discountAmount === "Percentage Off" && (
                      <TextField
                        size="small"
                        variant="outlined"
                        placeholder="20)"
                        value={discountText}
                        onChange={(e) => setDiscountText(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="end">%</InputAdornment>
                          ),
                        }}
                        sx={{ ml: 2, mt: 1, width: 100 }}
                      />
                    )}
                  </>
                }
              />
              <FormControlLabel
                value="Dollar Amount Off"
                control={<Radio />}
                label={
                  <>
                    Dollar Amount Off:
                    {discountAmount === "Dollar Amount Off" && (
                      <TextField
                        size="small"
                        variant="outlined"
                        placeholder="5"
                        value={discountText}
                        onChange={(e) => setDiscountText(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                        }}
                        sx={{ ml: 2, mt: 1, width: 100 }}
                      />
                    )}
                  </>
                }
              />
              <FormControlLabel
                value="Free Item"
                control={<Radio />}
                label={
                  <>
                    Free Item
                    {discountAmount === "Free Item" && (
                      <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Garlic knots"
                        value={discountText}
                        onChange={(e) => setDiscountText(e.target.value)}
                        sx={{ ml: 2, mt: 1, width: 200 }}
                      />
                    )}
                  </>
                }
              />
              <FormControlLabel
                value="BOGO Item"
                control={<Radio />}
                label={
                  <>
                    BOGO Item:
                    {discountAmount === "BOGO Item" && (
                      <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Wings"
                        value={discountText}
                        onChange={(e) => setDiscountText(e.target.value)}
                        sx={{ ml: 2, mt: 1, width: 200 }}
                      />
                    )}
                  </>
                }
              />
            </RadioGroup>
          </FormControl>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          style={{ marginTop: "1rem" }}
        />
        <FormControl>
          <FormLabel id="Release-Date-label"> Release Date </FormLabel>
          <RadioGroup>
            <FormControlLabel value={"ASAP"} control={<Radio />} label="ASAP" />
            <FormControlLabel
              value={"Schedule"}
              control={<Radio />}
              label="Schedule for later"
            />
          </RadioGroup>
        </FormControl>
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleSubmit}>
          Submit Post
        </Button>
      </DialogContent>
    </Dialog>
  );
}
