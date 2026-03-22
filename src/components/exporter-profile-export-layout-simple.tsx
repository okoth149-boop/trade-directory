'use client';

import { Business, Product } from '@/lib/api';
import { A4ExportWrapper } from './a4-export-wrapper';
import { Orientation } from '@/lib/a4-export-utils';

interface ExporterProfileExportLayoutSimpleProps {
  business: Business & {
    latitude?: number;
    longitude?: number;
    email?: string;
    websiteUrl?: string;
  };
  businessRating?: number;
  orientation: Orientation;
  quality?: 'screen' | 'print' | 'high';
}

const VerifiedBadge = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }} xmlns="http://www.w3.org/2000/svg">
    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7l-3.61.81.34 3.7L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
  </svg>
);

// Truncate text to a max word count
const truncate = (text: string, maxWords: number) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
};

export function ExporterProfileExportLayoutSimple({
  business,
  businessRating,
  orientation,
  quality = 'print',
}: ExporterProfileExportLayoutSimpleProps) {
  const products = business.products || [];
  const isPortrait = orientation === 'portrait';
  const maxProducts = isPortrait ? 6 : 5;

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 !== 0;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <span className="text-sm">
        {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)} {rating.toFixed(1)}
      </span>
    );
  };

  // Only render if value is truthy
  const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div className="flex gap-1 text-xs leading-snug">
        <span className="font-bold text-gray-600 shrink-0">{label}:</span>
        <span className="text-gray-900">{value}</span>
      </div>
    ) : null;

  // Location string for header (deduplicated)
  const locationParts = [business.town, business.county, business.location]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  const locationStr = [...new Set([...locationParts, 'Kenya'])].join(', ');

  return (
    <A4ExportWrapper orientation={orientation} quality={quality}>
      <div className="w-full h-full bg-white px-8 py-6 flex flex-col text-xs">

        {/* HEADER */}
        <div className="mb-3 pb-3 border-b-2 border-gray-900 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Logo */}
              <div className="flex-shrink-0">
                {business.logoUrl ? (
                  <div className="w-14 h-14 border-2 border-gray-900 bg-white overflow-hidden">
                    <img src={business.logoUrl} alt={business.name} className="w-full h-full object-contain p-1" />
                  </div>
                ) : (
                  <div className="w-14 h-14 border-2 border-gray-900 bg-white flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{business.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">{business.name}</h1>
                <p className="text-xs text-gray-600 mt-0.5">{locationStr}</p>
                <p className="text-xs text-gray-600">
                  {[business.sector, business.industry].filter(Boolean).join(' · ')}
                  {business.dateOfIncorporation && ` · Inc. ${business.dateOfIncorporation}`}
                </p>
                {businessRating && (
                  <p className="text-xs text-gray-700 mt-0.5 font-bold">{renderStars(businessRating)}</p>
                )}
              </div>
            </div>
            {/* Verification badge */}
            <div className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 border-2 border-gray-900">
              <VerifiedBadge />
              <span className="text-[10px] font-bold text-gray-900 uppercase">
                {business.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT — 2 columns */}
        <div className="flex-1 overflow-hidden">
          <div className={`grid gap-4 h-full ${isPortrait ? 'grid-cols-1' : 'grid-cols-2'}`}>

            {/* LEFT COLUMN */}
            <div className="space-y-3 overflow-hidden">

              {/* Products & Services */}
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-1.5 pb-1 border-b border-gray-900">Products & Services</h2>
                {business.serviceOffering && (
                  <p className="text-xs text-gray-700 mb-1.5 italic">{truncate(business.serviceOffering, 20)}</p>
                )}
                {Array.isArray(products) && products.length > 0 ? (
                  <ul className="space-y-0.5 list-disc list-inside">
                    {products.slice(0, maxProducts).map((p: Product, i: number) => (
                      <li key={i} className="text-xs text-gray-900">{p.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-600">Premium quality products for export markets</p>
                )}
                {business.productHsCode && (
                  <p className="text-xs text-gray-600 mt-1"><span className="font-bold">HS Code:</span> {business.productHsCode}</p>
                )}
              </div>

              {/* Business Information */}
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-1.5 pb-1 border-b border-gray-900">Business Information</h2>
                <div className="space-y-1">
                  <InfoRow label="Type of Business" value={business.typeOfBusiness} />
                  <InfoRow label="Legal Structure" value={(business as any).legalStructure} />
                  <InfoRow label="Date of Incorporation" value={business.dateOfIncorporation} />
                  <InfoRow label="Registration No." value={business.registrationNumber} />
                  <InfoRow label="KRA PIN" value={business.kraPin} />
                  <InfoRow label="Company Size" value={business.companySize} />
                  <InfoRow label="Employees" value={business.numberOfEmployees} />
                  <InfoRow label="Export Markets" value={business.currentExportMarkets} />
                  <InfoRow label="Export Volume (3 yrs)" value={business.exportVolumePast3Years} />
                  <InfoRow label="Production Capacity (3 yrs)" value={business.productionCapacityPast3} />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3 overflow-hidden">

              {/* Contact Information */}
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-1.5 pb-1 border-b border-gray-900">Contact Information</h2>
                <div className="space-y-1">
                  <InfoRow label="Email" value={business.contactEmail || business.email} />
                  <InfoRow label="Phone" value={business.contactPhone} />
                  <InfoRow label="Mobile" value={business.mobileNumber} />
                  <InfoRow label="WhatsApp" value={business.whatsappNumber} />
                  <InfoRow label="Website" value={business.websiteUrl || business.website} />
                  <InfoRow label="Address" value={business.physicalAddress} />
                </div>
              </div>

              {/* About — capped at 60 words */}
              {business.companyStory && (
                <div>
                  <h2 className="text-sm font-bold text-gray-900 mb-1.5 pb-1 border-b border-gray-900">About</h2>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {truncate(business.companyStory, 60)}
                  </p>
                </div>
              )}

              {/* Certifications */}
              {business.certifications && business.certifications.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-gray-900 mb-1.5 pb-1 border-b border-gray-900">Certifications</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {business.certifications.map((cert: any, i: number) => (
                      <span key={i} className="text-[10px] font-medium text-gray-800 px-1.5 py-0.5 border border-gray-700">
                        {cert.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-3 pt-2 border-t-2 border-gray-900 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-medium text-gray-900">Kenya Export Promotion & Branding Agency</p>
            <p className="text-[10px] text-gray-600">E-Trade Directory • www.keproba.go.ke</p>
          </div>
          <p className="text-[10px] text-gray-600">
            Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </A4ExportWrapper>
  );
}
