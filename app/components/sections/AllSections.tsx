"use client";

import ScheduleSection from "./ScheduleSection";
import WildcardsSection from "./WildcardsSection";
import DjSection from "./DjSection";
import FlightsSection from "./FlightsSection";
import RoomsSection from "./RoomsSection";
import GallerySection from "./GallerySection";
import VillaSection from "./VillaSection";
import DisplayNameModal from "../DisplayNameModal";

interface AllSectionsProps {
  isAdmin: boolean;
}

export default function AllSections({ isAdmin }: AllSectionsProps) {
  return (
    <>
      <DisplayNameModal />
      <WildcardsSection />
      <ScheduleSection isAdmin={isAdmin} />
      <DjSection isAdmin={isAdmin} />
      <FlightsSection />
      <RoomsSection isAdmin={isAdmin} />
      <GallerySection />
      <VillaSection />
    </>
  );
}
