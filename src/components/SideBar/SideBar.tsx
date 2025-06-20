import { Button } from "../../lib/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../lib/ui/components/dialog";
import "./SideBar.css";

interface SideBarProps {
  isMuted: boolean;
  onMuteChange: (isMuted: boolean) => void;
  onOpenChange: (isOpen: boolean) => void;
}

export default function SideBar({
  isMuted,
  onMuteChange,
  onOpenChange,
}: SideBarProps) {
  return (
    <div className="button-controls top-1/2 -translate-y-1/2">
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <i className="far fa-question" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Eye Beat You! - The Art of Making Faces
            </DialogTitle>
            <DialogDescription>
              A Comprehensive Guide to Looking Ridiculous on Camera
            </DialogDescription>
          </DialogHeader>
          <div className="help-content">
            <p className="help-section">
              <strong>What is this?</strong> A completely
              over-engineered application to make delightfully
              obnoxious sounds in the most roundabout way possible.
            </p>
            <p className="help-section">
              <strong>How do I use it?</strong> Blink and open your
              mouth! Make funny faces! Look around! See what happens.
            </p>
            <p className="help-section">
              <strong>Pro Tip:</strong> Make sure your face is
              visible, well-lit, and not covered by your hair or
              glasses.
            </p>
            <p className="help-section">
              <strong>Who made this?</strong>{" "}
              <a
                className="underline"
                href="https://github.com/logandarby"
                target="_blank"
                rel="noopener noreferrer"
              >
                I did.
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="icon"
        className={isMuted ? "muted-button" : ""}
        onClick={() => onMuteChange(!isMuted)}
      >
        <i
          className={`fas ${
            isMuted ? "fa-volume-xmark" : "fa-volume-high"
          }`}
        />
      </Button>
    </div>
  );
}
