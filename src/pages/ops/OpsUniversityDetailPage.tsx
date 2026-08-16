import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UniversityLogo } from "@/components/ops/UniversityLogo";
import { scaffoldUniversityMedia } from "@/lib/scaffoldUniversityMedia";
import { universitySlug } from "@/lib/universitySlug";
import {
  ChevronLeft,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createContact,
  createOffer,
  createProgram,
  BLANK_UNIVERSITY_NAME,
  deleteContact,
  deleteOffer,
  deleteOpsUniversity,
  fetchContacts,
  fetchOffers,
  fetchOpsUniversity,
  fetchPrograms,
  updateContact,
  updateOffer,
  updateOpsUniversity,
  updateProgram,
  upsertPartnership,
  verifyOffer,
} from "@/services/opsService";
import {
  OFFER_LABELS,
  OFFER_STATUSES,
  OPERATIONAL_LABELS,
  OPERATIONAL_STATUSES,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_STATUSES,
  type OfferStatus,
  type OperationalStatus,
  type OpsUniversity,
  type OpsProgram,
  type OpsOffer,
  type OpsContact,
  type ContactStatus,
  type ProgramDegreeType,
  type ProgramTeachingLanguage,
  type RelationshipStatus,
  PROGRAM_DEGREE_TYPES,
  PROGRAM_DURATION_PRESETS,
  PROGRAM_TEACHING_LANGUAGES,
  SCHOLARSHIP_TYPE_OPTIONS,
  programDurationToForm,
  programMajorCategory,
  resolveProgramDuration,
} from "@/types/ops";
import { VerificationBlock, formatLocation } from "@/components/ops/VerificationBlock";
import {
  OperationalStatusBadge,
  RelationshipStatusBadge,
} from "@/components/ops/OpsStatusBadge";
import { OpsProgramCard, OpsOfferCard } from "@/components/ops/OpsCards";
import { VerifyOfferDialog } from "@/components/ops/VerifyOfferDialog";
import { OpsDialog, OpsTabs } from "@/components/ops/OpsTabs";
import { OpsEmptyState, OpsInlineText, OpsSection } from "@/components/ops/OpsPage";
import { OpsLoading, OpsPanel, OpsPanelBody, OpsPanelHeader } from "@/components/ops/OpsLayout";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import { CURRENT_PRIMARY_INTAKE } from "@/lib/operatingCycle";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "programs", label: "Programs" },
  { id: "offers", label: "Offers" },
  { id: "contacts", label: "Contacts" },
  { id: "partnership", label: "Partnership" },
];

type IdentityField = "name" | "chinese_name" | "city" | "province" | "website";

function websiteHref(url: string) {
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

export default function OpsUniversityDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthContext();
  const [tab, setTab] = useState("overview");
  const [programOpen, setProgramOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<OpsProgram | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OpsOffer | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);
  const [deleteOfferLabel, setDeleteOfferLabel] = useState("");
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [deleteContactLabel, setDeleteContactLabel] = useState("");
  const [editingContact, setEditingContact] = useState<OpsContact | null>(null);

  const uniQ = useQuery({
    queryKey: ["ops-university", id],
    queryFn: () => fetchOpsUniversity(id),
    enabled: Boolean(id),
  });
  const programsQ = useQuery({
    queryKey: ["ops-programs", id],
    queryFn: () => fetchPrograms(id),
    enabled: Boolean(id),
  });
  const offersQ = useQuery({
    queryKey: ["ops-offers", id],
    queryFn: () => fetchOffers({ universityId: id }),
    enabled: Boolean(id),
  });
  const contactsQ = useQuery({
    queryKey: ["ops-contacts", id],
    queryFn: () => fetchContacts(id),
    enabled: Boolean(id),
  });

  const [programName, setProgramName] = useState("");
  const [degreeType, setDegreeType] = useState<ProgramDegreeType>("Chinese Language");
  const [language, setLanguage] = useState<ProgramTeachingLanguage>("Chinese");
  const [programDurationPreset, setProgramDurationPreset] = useState("__none__");
  const [programDurationCustom, setProgramDurationCustom] = useState("");
  const [programNotes, setProgramNotes] = useState("");
  const [programActive, setProgramActive] = useState(true);
  const [offerProgramId, setOfferProgramId] = useState("");
  const [intake, setIntake] = useState(CURRENT_PRIMARY_INTAKE);
  const [tuition, setTuition] = useState("10000");
  const [scholarshipType, setScholarshipType] = useState("");
  const [scholarshipNotes, setScholarshipNotes] = useState("");
  const [offerDeadline, setOfferDeadline] = useState("");
  const [offerStatus, setOfferStatus] = useState<OfferStatus>("potential");
  const [infoSource, setInfoSource] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPosition, setContactPosition] = useState("");
  const [contactWechat, setContactWechat] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [contactStatus, setContactStatus] = useState<ContactStatus>("active");
  const [verifyOfferId, setVerifyOfferId] = useState<string | null>(null);
  const [verifyOfferLabel, setVerifyOfferLabel] = useState("");

  const operationalStatusMutation = useMutation({
    mutationFn: (status: OperationalStatus) => updateOpsUniversity(id, { status }),
    onSuccess: () => {
      toast({ title: "Operational status updated" });
      qc.invalidateQueries({ queryKey: ["ops-university", id] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: (patch: Partial<OpsUniversity>) => updateOpsUniversity(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-university", id] });
      qc.invalidateQueries({ queryKey: ["ops-universities"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
    onError: (e: Error) =>
      toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const saveIdentityField =
    (field: IdentityField) => async (value: string | null) => {
      if (field === "name" && !value?.trim()) {
        toast({ title: "Name is required", variant: "destructive" });
        return;
      }

      const patch: Partial<OpsUniversity> = { [field]: value };
      if (field === "name" && value?.trim()) {
        const current = uniQ.data;
        if (current && !current.slug && !current.public_catalog_slug) {
          const slug = universitySlug(value.trim());
          patch.slug = slug;
          patch.public_catalog_slug = slug;
        }
      }

      await updateFieldMutation.mutateAsync(patch);

      if (field === "name" && value?.trim()) {
        const slug =
          patch.slug ??
          uniQ.data?.slug ??
          uniQ.data?.public_catalog_slug ??
          universitySlug(value.trim());
        await scaffoldUniversityMedia(value.trim(), slug);
      }
    };

  const removeMutation = useMutation({
    mutationFn: () => deleteOpsUniversity(id),
    onSuccess: () => {
      toast({ title: "University removed" });
      qc.invalidateQueries({ queryKey: ["ops-universities"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
      qc.invalidateQueries({ queryKey: ["ops-library-search"] });
      navigate("/ops/universities");
    },
    onError: (e: Error) =>
      toast({ title: "Could not remove", description: e.message, variant: "destructive" }),
  });

  const relationshipMutation = useMutation({
    mutationFn: (relationship_status: RelationshipStatus) =>
      upsertPartnership(id, { relationship_status }),
    onSuccess: () => {
      toast({ title: "Relationship updated" });
      qc.invalidateQueries({ queryKey: ["ops-university", id] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
  });

  const followUpMutation = useMutation({
    mutationFn: (days: number) =>
      upsertPartnership(id, {
        last_contacted_at: new Date().toISOString(),
        next_follow_up_at: new Date(Date.now() + days * 86400000).toISOString(),
      }),
    onSuccess: () => {
      toast({ title: "Scheduled" });
      qc.invalidateQueries({ queryKey: ["ops-university", id] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
  });

  const programMutation = useMutation({
    mutationFn: () =>
      createProgram({
        university_id: id,
        name: programName,
        degree_type: degreeType,
        teaching_language: language,
        major_category: programMajorCategory(degreeType),
        duration: resolveProgramDuration(programDurationPreset, programDurationCustom),
        notes: programNotes.trim() || null,
        active: programActive,
      }),
    onSuccess: () => {
      toast({ title: "Added" });
      closeProgramDialog();
      qc.invalidateQueries({ queryKey: ["ops-programs", id] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const offerMutation = useMutation({
    mutationFn: () =>
      createOffer({
        university_id: id,
        program_id: offerProgramId,
        intake,
        tuition: Number(tuition) || null,
        currency: "CNY",
        scholarship_type: scholarshipType.trim() || null,
        scholarship_notes: scholarshipNotes.trim() || null,
        deadline: offerDeadline.trim() || null,
        status: offerStatus,
        info_source: infoSource || null,
        last_verified_at: offerStatus === "active" ? new Date().toISOString() : null,
        verified_by: offerStatus === "active" ? user?.id ?? null : null,
      }),
    onSuccess: () => {
      toast({ title: "Added" });
      closeOfferDialog();
      qc.invalidateQueries({ queryKey: ["ops-offers", id] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateOfferMutation = useMutation({
    mutationFn: () => {
      if (!editingOffer) throw new Error("No offer selected");
      return updateOffer(editingOffer.id, {
        intake,
        tuition: Number(tuition) || null,
        scholarship_type: scholarshipType.trim() || null,
        scholarship_notes: scholarshipNotes.trim() || null,
        deadline: offerDeadline.trim() || null,
        status: offerStatus,
        info_source: infoSource.trim() || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Offer updated" });
      closeOfferDialog();
      qc.invalidateQueries({ queryKey: ["ops-offers", id] });
      qc.invalidateQueries({ queryKey: ["ops-offers-list"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
    onError: (e: Error) =>
      toast({ title: "Could not save offer", description: e.message, variant: "destructive" }),
  });

  const contactMutation = useMutation({
    mutationFn: () =>
      createContact({
        university_id: id,
        name: contactName,
        position: contactPosition.trim() || null,
        wechat: contactWechat || null,
        email: contactEmail || null,
        phone: contactPhone || null,
        notes: contactNotes.trim() || null,
        contact_type: "international_office",
        status: contactStatus,
      }),
    onSuccess: () => {
      toast({ title: "Added" });
      closeContactDialog();
      qc.invalidateQueries({ queryKey: ["ops-contacts", id] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateContactMutation = useMutation({
    mutationFn: () => {
      if (!editingContact) throw new Error("No contact selected");
      return updateContact(editingContact.id, {
        name: contactName.trim(),
        position: contactPosition.trim() || null,
        wechat: contactWechat.trim() || null,
        email: contactEmail.trim() || null,
        phone: contactPhone.trim() || null,
        notes: contactNotes.trim() || null,
        status: contactStatus,
      });
    },
    onSuccess: () => {
      toast({ title: "Contact updated" });
      closeContactDialog();
      qc.invalidateQueries({ queryKey: ["ops-contacts", id] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => deleteContact(contactId),
    onSuccess: () => {
      toast({ title: "Contact deleted" });
      setDeleteContactId(null);
      qc.invalidateQueries({ queryKey: ["ops-contacts", id] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
    onError: (e: Error) =>
      toast({ title: "Could not delete contact", description: e.message, variant: "destructive" }),
  });

  const resetContactForm = () => {
    setContactName("");
    setContactPosition("");
    setContactWechat("");
    setContactEmail("");
    setContactPhone("");
    setContactNotes("");
    setContactStatus("active");
    setEditingContact(null);
  };

  const openAddContact = () => {
    resetContactForm();
    setContactOpen(true);
  };

  const openEditContact = (contact: OpsContact) => {
    setEditingContact(contact);
    setContactName(contact.name);
    setContactPosition(contact.position ?? "");
    setContactWechat(contact.wechat ?? "");
    setContactEmail(contact.email ?? "");
    setContactPhone(contact.phone ?? "");
    setContactNotes(contact.notes ?? "");
    setContactStatus(contact.status);
    setContactOpen(true);
  };

  const closeContactDialog = () => {
    setContactOpen(false);
    resetContactForm();
  };

  const verifyMutation = useMutation({
    mutationFn: (input: { offerId: string; infoSource: string; sourceUrl: string; verificationNotes: string }) =>
      verifyOffer(input.offerId, {
        infoSource: input.infoSource,
        sourceUrl: input.sourceUrl || null,
        verifiedBy: user?.id ?? null,
        verificationNotes: input.verificationNotes || null,
      }),
    onSuccess: () => {
      toast({ title: "Offer verified & active" });
      setVerifyOfferId(null);
      qc.invalidateQueries({ queryKey: ["ops-offers", id] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const resetProgramForm = () => {
    setProgramName("");
    setDegreeType("Chinese Language");
    setLanguage("Chinese");
    setProgramDurationPreset("__none__");
    setProgramDurationCustom("");
    setProgramNotes("");
    setProgramActive(true);
    setEditingProgram(null);
  };

  const openAddProgram = () => {
    resetProgramForm();
    setProgramOpen(true);
  };

  const openEditProgram = (program: OpsProgram) => {
    setEditingProgram(program);
    setProgramName(program.name);
    const normalizedDegree =
      program.degree_type === "Language" ? "Chinese Language" : program.degree_type;
    setDegreeType((normalizedDegree as ProgramDegreeType) || "Chinese Language");
    setLanguage((program.teaching_language as ProgramTeachingLanguage) || "Chinese");
    const durationForm = programDurationToForm(program.duration);
    setProgramDurationPreset(durationForm.preset);
    setProgramDurationCustom(durationForm.custom);
    setProgramNotes(program.notes ?? "");
    setProgramActive(program.active);
    setProgramOpen(true);
  };

  const closeProgramDialog = () => {
    setProgramOpen(false);
    resetProgramForm();
  };

  const resetOfferForm = () => {
    setOfferProgramId("");
    setIntake(CURRENT_PRIMARY_INTAKE);
    setTuition("10000");
    setScholarshipType("");
    setScholarshipNotes("");
    setOfferDeadline("");
    setOfferStatus("potential");
    setInfoSource("");
    setEditingOffer(null);
  };

  const openAddOffer = () => {
    resetOfferForm();
    setTab("offers");
    setOfferOpen(true);
  };

  const openEditOffer = (offer: OpsOffer & { program?: OpsProgram | null }) => {
    setEditingOffer(offer);
    setOfferProgramId(offer.program_id);
    setIntake(offer.intake);
    setTuition(offer.tuition != null ? String(offer.tuition) : "");
    setScholarshipType(offer.scholarship_type ?? "");
    setScholarshipNotes(offer.scholarship_notes ?? "");
    setOfferDeadline(offer.deadline ?? "");
    setOfferStatus(offer.status);
    setInfoSource(offer.info_source ?? "");
    setOfferOpen(true);
  };

  const closeOfferDialog = () => {
    setOfferOpen(false);
    resetOfferForm();
  };

  const deleteOfferMutation = useMutation({
    mutationFn: (offerId: string) => deleteOffer(offerId),
    onSuccess: () => {
      toast({ title: "Offer deleted" });
      setDeleteOfferId(null);
      qc.invalidateQueries({ queryKey: ["ops-offers", id] });
      qc.invalidateQueries({ queryKey: ["ops-offers"] });
      qc.invalidateQueries({ queryKey: ["ops-offers-list"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
    onError: (e: Error) =>
      toast({ title: "Could not delete offer", description: e.message, variant: "destructive" }),
  });

  const updateProgramMutation = useMutation({
    mutationFn: () => {
      if (!editingProgram) throw new Error("No program selected");
      return updateProgram(editingProgram.id, {
        name: programName.trim(),
        degree_type: degreeType,
        teaching_language: language,
        major_category: programMajorCategory(degreeType),
        duration: resolveProgramDuration(programDurationPreset, programDurationCustom),
        notes: programNotes.trim() || null,
        active: programActive,
      });
    },
    onSuccess: () => {
      toast({ title: "Program updated" });
      closeProgramDialog();
      qc.invalidateQueries({ queryKey: ["ops-programs", id] });
      qc.invalidateQueries({ queryKey: ["ops-offers", id] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const uni = uniQ.data;
  const activeOffers = useMemo(
    () => (offersQ.data ?? []).filter((o) => o.status === "active").length,
    [offersQ.data],
  );

  if (uniQ.isLoading) return <OpsLoading />;
  if (uniQ.isError) {
    return (
      <OpsEmptyState
        title="Could not load"
        description={uniQ.error instanceof Error ? uniQ.error.message : undefined}
        action={
          <Button variant="outline" onClick={() => uniQ.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }
  if (!uni) {
    return (
      <OpsEmptyState
        title="Not found"
        action={
          <Button asChild variant="outline">
            <Link to="/ops/universities">Back</Link>
          </Button>
        }
      />
    );
  }

  const operationalStatus = uni.status ?? "research";
  const relationshipStatus = uni.partnership?.relationship_status ?? "no_relationship";
  const isBlankStub = uni.name === BLANK_UNIVERSITY_NAME;
  const fieldSaving = updateFieldMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        to="/ops/universities"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Universities
      </Link>

      <header className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-card md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <UniversityLogo
              slug={uni.public_catalog_slug ?? uni.slug}
              logoUrl={uni.logo_url}
              name={uni.name}
              className="h-14 w-14 shrink-0"
              imgClassName="h-10 w-10"
            />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{uni.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatLocation([uni.city, uni.province, uni.country])}
                {uni.chinese_name ? ` · ${uni.chinese_name}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <OperationalStatusBadge status={operationalStatus} />
                <RelationshipStatusBadge status={relationshipStatus} />
                <span className="text-xs text-muted-foreground">
                  Offers · {activeOffers}
                </span>
                <span className="text-xs text-muted-foreground">
                  Programs · {programsQ.data?.length ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={openAddProgram}>
              <Plus className="h-4 w-4" /> Program
            </Button>
            <Button variant="outline" size="sm" onClick={openAddOffer}>
              <Plus className="h-4 w-4" /> Offer & scholarship
            </Button>
            <Button variant="outline" size="sm" onClick={openAddContact}>
              <Plus className="h-4 w-4" /> Contact
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
              title="Remove from ops"
              aria-label="Remove from ops"
              onClick={() => setRemoveOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <OpsTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <OpsPanel className="lg:col-span-2">
            <OpsPanelHeader title="University" />
            <OpsPanelBody>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Name</dt>
                  <dd className="mt-1 font-medium">
                    <OpsInlineText
                      value={uni.name}
                      placeholder="University name"
                      emptyLabel="—"
                      required
                      autoEdit={isBlankStub}
                      saving={fieldSaving}
                      onSave={saveIdentityField("name")}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Chinese name</dt>
                  <dd className="mt-1">
                    <OpsInlineText
                      value={uni.chinese_name}
                      placeholder="Chinese name"
                      emptyLabel="—"
                      saving={fieldSaving}
                      onSave={saveIdentityField("chinese_name")}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">City</dt>
                  <dd className="mt-1">
                    <OpsInlineText
                      value={uni.city}
                      placeholder="City"
                      emptyLabel="—"
                      saving={fieldSaving}
                      onSave={saveIdentityField("city")}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Province</dt>
                  <dd className="mt-1">
                    <OpsInlineText
                      value={uni.province}
                      placeholder="Province"
                      emptyLabel="—"
                      saving={fieldSaving}
                      onSave={saveIdentityField("province")}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Website</dt>
                  <dd className="mt-1">
                    <OpsInlineText
                      value={uni.website}
                      placeholder="https://…"
                      emptyLabel="—"
                      saving={fieldSaving}
                      onSave={saveIdentityField("website")}
                      renderDisplay={(url) => (
                        <a
                          href={websiteHref(url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand hover:underline"
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {url}
                        </a>
                      )}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Source</dt>
                  <dd className="mt-1 text-sm capitalize">{uni.record_source.replace(/_/g, " ")}</dd>
                </div>
              </dl>
            </OpsPanelBody>
          </OpsPanel>

          <OpsPanel>
            <OpsPanelHeader title="Next action" />
            <OpsPanelBody>
              <p className="text-sm font-medium">
                {uni.partnership?.next_follow_up_at
                  ? new Date(uni.partnership.next_follow_up_at).toLocaleDateString()
                  : "—"}
              </p>
            </OpsPanelBody>
          </OpsPanel>
        </div>
      )}

      {tab === "programs" && (
        <OpsSection
          title="Programs"
          action={
            <Button size="sm" onClick={openAddProgram}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          }
        >
          {(programsQ.data ?? []).length === 0 ? (
            <OpsEmptyState
              title="No programs"
              action={
                <Button onClick={openAddProgram}>Add</Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(programsQ.data ?? []).map((p) => (
                <OpsProgramCard
                  key={p.id}
                  name={p.name}
                  degreeType={p.degree_type}
                  language={p.teaching_language}
                  duration={p.duration}
                  inactive={!p.active}
                  actions={
                    <Button size="sm" variant="outline" onClick={() => openEditProgram(p)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </OpsSection>
      )}

      {tab === "offers" && (
        <OpsSection
          title="Offers & scholarships"
          action={
            <Button size="sm" onClick={openAddOffer}>
              <Plus className="h-4 w-4" /> Add offer
            </Button>
          }
        >
          {(offersQ.data ?? []).length === 0 ? (
            <OpsEmptyState
              title="No offers"
              action={<Button onClick={openAddOffer}>Add</Button>}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {(offersQ.data ?? []).map((o) => (
                <OpsOfferCard
                  key={o.id}
                  programName={o.program?.name}
                  intake={o.intake}
                  status={o.status}
                  tuition={o.tuition}
                  currency={o.currency}
                  scholarship={o.scholarship_type ?? undefined}
                  scholarshipNotes={o.scholarship_notes ?? undefined}
                  deadline={o.deadline ?? undefined}
                  infoSource={o.info_source}
                  lastVerifiedAt={o.last_verified_at}
                  sourceUrl={o.source_url}
                  actions={
                    <>
                      {o.status !== "active" || !o.last_verified_at ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setVerifyOfferId(o.id);
                            setVerifyOfferLabel(`${o.program?.name ?? "Program"} · ${o.intake}`);
                          }}
                        >
                          Verify
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => openEditOffer(o)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        onClick={() => {
                          setDeleteOfferId(o.id);
                          setDeleteOfferLabel(`${o.program?.name ?? "Program"} · ${o.intake}`);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </OpsSection>
      )}

      {tab === "contacts" && (
        <OpsSection
          title="Contacts"
          action={
            <Button size="sm" onClick={openAddContact}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          }
        >
          {(contactsQ.data ?? []).length === 0 ? (
            <OpsEmptyState
              title="No contacts"
              action={<Button onClick={openAddContact}>Add</Button>}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(contactsQ.data ?? []).map((c) => (
                <article
                  key={c.id}
                  className={`rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm ${c.status !== "active" ? "opacity-60" : ""}`}
                >
                  <p className="font-medium">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.position || "International Office"}
                  </p>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    {c.email ? (
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> {c.email}
                      </p>
                    ) : null}
                    {c.wechat ? (
                      <p className="flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5" /> {c.wechat}
                      </p>
                    ) : null}
                    {c.phone ? <p>{c.phone}</p> : null}
                    {c.notes ? <p className="text-foreground/80">{c.notes}</p> : null}
                  </div>
                  {c.next_follow_up_at ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Follow up · {new Date(c.next_follow_up_at).toLocaleDateString()}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-black/[0.04] pt-3">
                    <Button variant="outline" size="sm" onClick={() => openEditContact(c)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => followUpMutation.mutate(7)}>
                      Follow up
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      onClick={() => {
                        setDeleteContactId(c.id);
                        setDeleteContactLabel(c.name);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </OpsSection>
      )}

      {tab === "partnership" && (
        <OpsPanel>
          <OpsPanelHeader title="Status" />
          <OpsPanelBody className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Operational status</p>
              <OperationalStatusBadge status={operationalStatus} />
              <Select
                value={operationalStatus}
                onValueChange={(v) => operationalStatusMutation.mutate(v as OperationalStatus)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATIONAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {OPERATIONAL_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Relationship status</p>
              <RelationshipStatusBadge status={relationshipStatus} />
              <Select
                value={relationshipStatus}
                onValueChange={(v) => relationshipMutation.mutate(v as RelationshipStatus)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {RELATIONSHIP_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Follow up</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => followUpMutation.mutate(3)}>
                  +3d
                </Button>
                <Button variant="outline" size="sm" onClick={() => followUpMutation.mutate(7)}>
                  +7d
                </Button>
              </div>
              {uni.partnership?.next_follow_up_at ? (
                <p className="text-xs text-muted-foreground">
                  {new Date(uni.partnership.next_follow_up_at).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          </OpsPanelBody>
        </OpsPanel>
      )}

      <OpsDialog
        open={programOpen}
        onClose={closeProgramDialog}
        title={editingProgram ? "Edit program" : "Add program"}
        footer={
          <>
            <Button variant="outline" onClick={closeProgramDialog}>Cancel</Button>
            <Button
              disabled={
                !programName.trim() ||
                programMutation.isPending ||
                updateProgramMutation.isPending
              }
              onClick={() =>
                editingProgram ? updateProgramMutation.mutate() : programMutation.mutate()
              }
            >
              {editingProgram ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Program name</label>
            <Input
              placeholder="e.g. Chinese Language Program"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Degree type</label>
            <Select value={degreeType} onValueChange={(v) => setDegreeType(v as ProgramDegreeType)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Degree type" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_DEGREE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Language</label>
            <Select value={language} onValueChange={(v) => setLanguage(v as ProgramTeachingLanguage)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_TEACHING_LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Duration</label>
            <Select value={programDurationPreset} onValueChange={setProgramDurationPreset}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                <SelectItem value="__none__">Not set</SelectItem>
                {PROGRAM_DURATION_PRESETS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
                {programDurationPreset === "__custom__" ? (
                  <SelectItem value="__custom__">Other</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
            {programDurationPreset === "__custom__" ? (
              <Input
                placeholder="e.g. 18 months, 1 semester"
                value={programDurationCustom}
                onChange={(e) => setProgramDurationCustom(e.target.value)}
                className="rounded-xl"
              />
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <Textarea
              placeholder="Optional details, intake notes, requirements…"
              value={programNotes}
              onChange={(e) => setProgramNotes(e.target.value)}
              className="min-h-[80px] rounded-xl"
            />
          </div>
          {editingProgram ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={programActive ? "active" : "inactive"}
                onValueChange={(v) => setProgramActive(v === "active")}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </OpsDialog>

      <OpsDialog
        open={offerOpen}
        onClose={closeOfferDialog}
        title={editingOffer ? "Edit offer & scholarship" : "Add offer & scholarship"}
        description="Link a program + intake to tuition and scholarship (50%, 100%, full, etc.)."
        footer={
          <>
            <Button variant="outline" onClick={closeOfferDialog}>Cancel</Button>
            <Button
              disabled={
                !offerProgramId ||
                !intake ||
                offerMutation.isPending ||
                updateOfferMutation.isPending
              }
              onClick={() =>
                editingOffer ? updateOfferMutation.mutate() : offerMutation.mutate()
              }
            >
              {editingOffer ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {editingOffer ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Program</label>
              <p className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-2 text-sm">
                {(programsQ.data ?? []).find((p) => p.id === offerProgramId)?.name ?? "Program"}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Program</label>
              <Select value={offerProgramId} onValueChange={setOfferProgramId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent>
                  {(programsQ.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Intake</label>
            <Input
              placeholder="Intake e.g. 2027-09"
              value={intake}
              onChange={(e) => setIntake(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="rounded-xl border border-brand/20 bg-brand/[0.04] px-3 py-2.5 space-y-3">
            <p className="text-xs font-medium text-brand">Scholarship (optional)</p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select
                value={scholarshipType || "__none__"}
                onValueChange={(v) => setScholarshipType(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="rounded-xl bg-white">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {SCHOLARSHIP_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "__none__"} value={opt.value || "__none__"}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Scholarship notes</label>
              <Textarea
                placeholder="e.g. Merit-based; covers tuition + dorm; HSK 5 required"
                value={scholarshipNotes}
                onChange={(e) => setScholarshipNotes(e.target.value)}
                className="min-h-[72px] rounded-xl bg-white"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tuition (¥)</label>
            <Input
              placeholder="Tuition ¥"
              value={tuition}
              onChange={(e) => setTuition(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Deadline</label>
            <DatePicker
              value={offerDeadline ? new Date(`${offerDeadline}T12:00:00`) : undefined}
              onChange={(date) =>
                setOfferDeadline(date instanceof Date ? format(date, "yyyy-MM-dd") : "")
              }
              inputValue={offerDeadline}
              onTextChange={setOfferDeadline}
              placeholder="Pick deadline"
              className="[&_input]:rounded-xl [&_button]:rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={offerStatus} onValueChange={(v) => setOfferStatus(v as OfferStatus)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OFFER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {OFFER_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Source</label>
            <Input
              placeholder="Source (e.g. Official PDF)"
              value={infoSource}
              onChange={(e) => setInfoSource(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
      </OpsDialog>

      <OpsDialog
        open={contactOpen}
        onClose={closeContactDialog}
        title={editingContact ? "Edit contact" : "Add contact"}
        footer={
          <>
            <Button variant="outline" onClick={closeContactDialog}>Cancel</Button>
            <Button
              disabled={
                !contactName.trim() ||
                contactMutation.isPending ||
                updateContactMutation.isPending
              }
              onClick={() =>
                editingContact ? updateContactMutation.mutate() : contactMutation.mutate()
              }
            >
              {editingContact ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              placeholder="Contact name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Position</label>
            <Input
              placeholder="e.g. International Office"
              value={contactPosition}
              onChange={(e) => setContactPosition(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input
              placeholder="Email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">WeChat</label>
            <Input
              placeholder="WeChat"
              value={contactWechat}
              onChange={(e) => setContactWechat(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Phone</label>
            <Input
              placeholder="Phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <Textarea
              placeholder="Optional notes"
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
              className="min-h-[80px] rounded-xl"
            />
          </div>
          {editingContact ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={contactStatus}
                onValueChange={(v) => setContactStatus(v as ContactStatus)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </OpsDialog>

      <OpsDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="Remove university?"
        description={`Remove ${uni.name} from ops? Programs, offers, and contacts for this university will be deleted. It can be added again from Library.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={() => removeMutation.mutate()}
            >
              Remove
            </Button>
          </>
        }
      />

      <OpsDialog
        open={Boolean(deleteContactId)}
        onClose={() => setDeleteContactId(null)}
        title="Delete contact?"
        description={`Remove ${deleteContactLabel}?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteContactId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteContactMutation.isPending}
              onClick={() => {
                if (deleteContactId) deleteContactMutation.mutate(deleteContactId);
              }}
            >
              Delete
            </Button>
          </>
        }
      />

      <OpsDialog
        open={Boolean(deleteOfferId)}
        onClose={() => setDeleteOfferId(null)}
        title="Delete offer?"
        description={`Remove ${deleteOfferLabel}? Linked student snapshots are preserved.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOfferId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteOfferMutation.isPending}
              onClick={() => {
                if (deleteOfferId) deleteOfferMutation.mutate(deleteOfferId);
              }}
            >
              Delete
            </Button>
          </>
        }
      />

      <VerifyOfferDialog
        open={Boolean(verifyOfferId)}
        onClose={() => setVerifyOfferId(null)}
        offerLabel={verifyOfferLabel}
        loading={verifyMutation.isPending}
        onConfirm={(input) => {
          if (!verifyOfferId) return;
          verifyMutation.mutate({ offerId: verifyOfferId, ...input });
        }}
      />
    </div>
  );
}
