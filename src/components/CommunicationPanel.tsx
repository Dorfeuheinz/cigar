import { Button, Checkbox, Label, Textarea } from "flowbite-react";

function CommunicationPanel() {
  return (
    <form className="flex max-w-md flex-col gap-4">
      <div className="max-w-md">
        <div className="mb-2 block">
          <Label htmlFor="comment" value="Your message" />
        </div>
        <Textarea
          id="comment"
          placeholder="Leave a comment..."
          required
          rows={1}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="remember" />
        <Label htmlFor="remember">Remember me</Label>
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
}

export default CommunicationPanel;
