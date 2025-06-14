import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";

function ThemeDemo() {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (checked: boolean | "indeterminate") => {
    setIsChecked(checked === true);
  };

  return (
    <div className="min-h-screen bg-background texture-bg p-8">
      {/* Navigation */}
      <div className="absolute top-4 left-4 z-10">
        <Link to="/">
          <Button variant="outline" animation="bounce" size="sm">
            Back to Game
          </Button>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-display font-bold text-brand-orange-dark">
            Theme Demo
          </h1>
        </div>

        {/* Button Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variants & Animations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Default Buttons */}
              <div className="space-y-3">
                <h3 className="font-semibold text-brand-orange-dark">
                  Default (Bounce)
                </h3>
                <Button animation="bounce">Bounce Button</Button>
                <Button animation="bounce" size="sm">
                  Small Bounce
                </Button>
                <Button animation="bounce" size="lg">
                  Large Bounce
                </Button>
              </div>

              {/* Outline Buttons */}
              <div className="space-y-3">
                <h3 className="font-semibold text-brand-orange-dark">
                  Outline (Pulse)
                </h3>
                <Button variant="outline" animation="pulse">
                  Pulse Button
                </Button>
                <Button variant="outline" animation="pulse" size="sm">
                  Small Pulse
                </Button>
                <Button variant="outline" animation="pulse" size="lg">
                  Large Pulse
                </Button>
              </div>

              {/* Secondary Buttons */}
              <div className="space-y-3">
                <h3 className="font-semibold text-brand-orange-dark">
                  Secondary (Pulse)
                </h3>
                <Button variant="secondary" animation="pulse">
                  Pulse Button
                </Button>
                <Button variant="secondary" animation="pulse" size="sm">
                  Small Pulse
                </Button>
                <Button variant="secondary" animation="pulse" size="lg">
                  Large Pulse
                </Button>
              </div>

              {/* Ghost & Link */}
              <div className="space-y-3">
                <h3 className="font-semibold text-brand-orange-dark">
                  Ghost & Link
                </h3>
                <Button variant="ghost" animation="bounce">
                  Ghost Button
                </Button>
                <Button variant="link" animation="pulse">
                  Link Button
                </Button>
              </div>

              {/* Icon Button */}
              <div className="space-y-3">
                <h3 className="font-semibold text-brand-orange-dark">
                  Icon Button
                </h3>
                <Button variant="default" size="icon" animation="bounce">
                  🎯
                </Button>
              </div>

              {/* Destructive */}
              <div className="space-y-3">
                <h3 className="font-semibold text-brand-orange-dark">
                  Destructive
                </h3>
                <Button variant="destructive" animation="pulse">
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Textured Card</CardTitle>
              <CardDescription>
                This card has a texture background with semi-transparent
                overlay
              </CardDescription>
            </CardHeader>
            <CardContent></CardContent>
            <CardFooter>
              <Button variant="outline" animation="pulse" size="sm">
                Learn More
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interactive Elements</CardTitle>
              <CardDescription>
                Cards with various interactive components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="demo-checkbox"
                  checked={isChecked}
                  onCheckedChange={handleCheckboxChange}
                />
                <label
                  htmlFor="demo-checkbox"
                  className="text-sm font-medium text-brand-dark"
                >
                  Animated checkbox with bounce effect
                </label>
              </div>
              <div className="space-y-2">
                <Button variant="secondary" size="sm" className="w-full">
                  Secondary Action
                </Button>
                <Button variant="ghost" size="sm" className="w-full">
                  Ghost Action
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Our custom brand colors in action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-brand-orange h-12 rounded-lg flex items-center justify-center">
                  <span className="text-brand-cream text-xs font-bold">
                    Orange 400
                  </span>
                </div>
                <div className="bg-brand-orange-dark h-12 rounded-lg flex items-center justify-center">
                  <span className="text-brand-cream text-xs font-bold">
                    Orange 800
                  </span>
                </div>
                <div className="bg-brand-cream h-12 rounded-lg flex items-center justify-center border-2 border-brand-orange-dark">
                  <span className="text-brand-dark text-xs font-bold">
                    Cream
                  </span>
                </div>
                <div className="bg-brand-dark h-12 rounded-lg flex items-center justify-center">
                  <span className="text-brand-cream text-xs font-bold">
                    Dark Grey
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Dialog Components</CardTitle>
            <CardDescription>
              Modals and dialogs with texture backgrounds and animations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default" animation="bounce">
                    Open Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Themed Dialog</DialogTitle>
                    <DialogDescription>
                      This dialog showcases the textured background with
                      our brand colors. Notice how the close button has a
                      fun hover animation!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-brand-dark/80">
                      The dialog content is perfectly readable against the
                      textured background thanks to the semi-transparent
                      overlay.
                    </p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="dialog-checkbox" />
                        <label
                          htmlFor="dialog-checkbox"
                          className="text-sm"
                        >
                          I agree to the terms
                        </label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" animation="pulse">
                      Cancel
                    </Button>
                    <Button variant="default" animation="bounce">
                      Confirm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" animation="pulse">
                    Another Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Feature Preview</DialogTitle>
                    <DialogDescription>
                      Experience the smooth animations and beautiful
                      styling.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="space-y-4">
                      <Button variant="secondary" className="w-full">
                        Full Width Button
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="ghost" size="sm">
                          Ghost
                        </Button>
                        <Button
                          variant="outline"
                          animation="pulse"
                          size="sm"
                        >
                          Outline
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Checkbox Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Checkboxes</CardTitle>
            <CardDescription>
              Checkboxes with bounce animations and brand styling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="option1" />
                  <label htmlFor="option1" className="text-sm font-medium">
                    Enable notifications
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="option2" defaultChecked />
                  <label htmlFor="option2" className="text-sm font-medium">
                    Auto-save enabled (checked by default)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="option3" />
                  <label htmlFor="option3" className="text-sm font-medium">
                    Dark mode preference
                  </label>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="option4" />
                  <label htmlFor="option4" className="text-sm font-medium">
                    Marketing emails
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="option5" />
                  <label htmlFor="option5" className="text-sm font-medium">
                    Product updates
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="option6" disabled />
                  <label
                    htmlFor="option6"
                    className="text-sm font-medium text-brand-dark/50"
                  >
                    Disabled option
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-brand-dark/60">
            🎨 Custom theme with texture backgrounds, pill buttons, and fun
            animations!
          </p>
        </div>
      </div>
    </div>
  );
}

export default ThemeDemo;
