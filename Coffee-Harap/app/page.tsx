'use client';
import React, { useState } from "react";
import { AuroraBackground } from "../components/ui/aurora-background";
import Navbar from "../components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Dropdown from "@/components/ui/dropdown";
import { GiHamburgerMenu } from "react-icons/gi";
import  {CardsCarousel}  from "../components/ui/cards-carousel-inputs";
import { FileUpload } from "@/components/ui/file-upload";
export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  return (
      <AuroraBackground>
        <Navbar onToggleMenu={toggleMenu} />
        {!isMenuOpen && (
          <div className="flex flex-col md:flex-row justify-center items-center h-full pt-20 space-y-4 md:space-y-0 md:space-x-8 relative z-20">
            <Card className="relative overflow-hidden w-auto mt-4">
              <div className="relative z-10 p-4">
                <CardHeader>
                  <CardTitle className="text-center">Upload Instructions</CardTitle>
                  <CardDescription>
                    <div className="w-96 mb-1">Detect Species and Diseases in Coffee Leaves</div>
                    <div className="w-96 mb-4">
                      Our model is designed to identify diseases specifically in coffee leaves. To get started, please follow the simple steps:
                    </div>
                    <div className="w-96 mb-2">
                      <span className="font-bold">1. Prepare Your Photo: </span>
                      Ensure that the photo clearly shows a coffee leaf. Avoid blurriness and make sure the leaf is the main focus of the image.
                    </div>
                    <div className="w-96 mb-2">
                      <span className="font-bold">2. File Format: </span>
                      Accepted file formats are JPEG and PNG.
                    </div>
                    <div className="w-96 mb-2">
                      <span className="font-bold">3. Image Quality: </span>
                      For the best results, upload images with a resolution of at least 1024x768 pixels.
                    </div>
                    <div className="w-96 mb-2">
                      <span className="font-bold">4. Upload Your Photo: </span>
                      Click the upload button below. Select the photo of the coffee leaf from your device.
                    </div>
                    <div className="w-96 mb-2">
                      <span className="font-bold">5. Review and Submit: </span>
                      After uploading, review the image preview to ensure clarity and focus. Click Submit to analyze.
                    </div>
                  </CardDescription>
                  <CardTitle className="text-center mb-4">Important Notes</CardTitle>
                  <CardDescription>
                    <div className="w-96 mb-2">
                      <span className="font-bold">Specific to Coffee Leaves: </span>
                      Our model is currently optimized to detect diseases only in coffee leaves. Please do not upload images of other plant types.
                    </div>
                    <div className="w-96 mb-2">
                      <span className="font-bold">Privacy: </span>
                      Your photos are processed securely and will not be stored or shared.
                    </div>
                  </CardDescription>
                </CardHeader>
              </div>
            </Card>
            <Card className="relative overflow-hidden w-96 h-auto">
            <div className="relative z-10 p-4">
              <Dropdown icon={<GiHamburgerMenu size={24} />}>                 
              </Dropdown>
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
                <CardDescription>Upload a coffee leaf image to analyze.</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload />
              </CardContent>
              <CardFooter />
            </div>
          </Card>
        </div>
        )}
              <div id="cards-carousel" className="relative mt-12 z-0">
        <CardsCarousel/>
      </div>
      </AuroraBackground>

  );
}
