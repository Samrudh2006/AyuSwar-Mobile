import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Layers, 
  Cpu, 
  Mic, 
  Database,
  ShieldCheck,
  Download,
  Printer,
  Activity,
  Server,
  BarChart3,
  GitBranch,
  Radio
} from 'lucide-react';
import HandDrawnExplainer from '../components/HandDrawnExplainer';
import PipelineTerminal from '../components/PipelineTerminal';
import { downloadAbdmWhitepaper, printAbdmDossier } from '../utils/abdmWhitepaperExport';

/**
 * ArchitectureView Component
 * Streamlined Technical Architecture Specification for AyuSwar AI.
 * Centered around the full-width rough.js Hand-Drawn Whiteboard Explainer.
 */
export default function ArchitectureView() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const INTEROP_STANDARDS = [
    {
      title: 'Acoustic Signal DSP',
      tag: 'W3C AudioContext & Web Speech',
      desc: 'Local browser 16kHz PCM audio intake and spectral formant extraction without mandatory server compute.',
      icon: Mic,
      color: '#047857'
    },
    {
      title: 'Clinical Lexicon & NLP',
      tag: 'SNOMED CT & ICD-10 Indic Map',
      desc: 'Vernacular Telugu and Indic colloquial idiom mapping to clinical reference codes for reviewer inspection.',
      icon: Cpu,
      color: '#0284C7'
    },
    {
      title: 'Interoperable Records',
      tag: 'HL7 FHIR R4 Schema',
      desc: 'FHIR-shaped local research drafts for patient encounter review; no digital signature or ABDM exchange is connected.',
      icon: Database,
      color: '#0F4C5C'
    },
    {
      title: 'National Data Repository',
      tag: 'Synthetic reference sample',
      desc: 'Bundled Indic speech examples and sample generic-drug schemas; no repository endorsement is claimed.',
      icon: ShieldCheck,
      color: '#B45309'
    }
  ];

  return (
    <div className="architecture-view-container" style={{ padding: '36px 24px 64px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F4C5C', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
          <ArrowLeft size={16} />
          <span>Home</span>
        </Link>
        <span style={{ color: '#4A5A50' }}>/</span>
        <span style={{ color: '#122028', fontSize: '13px' }}>Technology</span>
        <span style={{ color: '#4A5A50' }}>/</span>
        <span style={{ color: '#081C24', fontSize: '13px', fontWeight: 700 }}>Architecture Pipeline</span>
      </div>

      {/* Clean, Modern Header */}
      <div className="architecture-header" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 0, 0, 0.07)', color: '#0F4C5C', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, marginBottom: '10px' }}>
          <Layers size={14} />
          <span>SYSTEM ARCHITECTURE & PIPELINE HLD</span>
        </div>
        <h1 className="page-main-heading" style={{ fontSize: '32px', fontWeight: 850, color: '#081C24', marginBottom: '8px', letterSpacing: '-0.4px' }}>
          Technical Architecture & Intake Pipeline
        </h1>
        <p className="page-main-subtext" style={{ fontSize: '15px', color: '#37525C', maxWidth: '850px', lineHeight: 1.5, margin: 0 }}>
          Interactive architectural blueprint detailing the 4-stage data pipeline from practice consultation audio capture to a local FHIR-shaped research draft.
        </p>
      </div>

      {/* Main Centerpiece: Full-Width rough.js Hand-Drawn Whiteboard Explainer */}
      <HandDrawnExplainer />

      {/* Real-Time Client Runtime Pipeline Terminal */}
      <div style={{ marginTop: '8px', marginBottom: '32px' }}>
        <PipelineTerminal />
      </div>

      {/* Standards-informed FHIR draft architecture notes */}
      <div 
        style={{
          background: '#0F4C5C',
          borderRadius: '20px',
          padding: '28px 24px',
          color: '#FFFFFF',
          marginBottom: '36px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.13)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#6EE7B7', padding: '4px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 800, marginBottom: '12px' }}>
              <ShieldCheck size={14} />
              <span>STANDARDS-INFORMED LOCAL DRAFT ARCHITECTURE</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 850, margin: '0 0 8px 0', letterSpacing: '-0.3px', color: '#FFFFFF' }}>
              FHIR Draft Architecture & Technical Notes
            </h2>
            <p style={{ fontSize: '13.5px', color: '#D0DFE2', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              Internal engineering notes describing how local structures are inspired by ABDM concepts, HL7 FHIR R4 document shapes, and offline-first resilience. No NHA sandbox verification, ABHA/HPR verification, DSC, or registry connection is claimed.
            </p>

            {/* Milestone Status Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.08)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <ShieldCheck size={14} color="#34D399" />
                <span>Concept: ABHA-style identifiers (not verified)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.08)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <ShieldCheck size={14} color="#34D399" />
                <span>Concept: HIP-shaped FHIR draft (no DSC)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.08)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <ShieldCheck size={14} color="#34D399" />
                <span>Concept: longitudinal-record model (not connected)</span>
              </div>
            </div>
          </div>

          {/* Action Download Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
            <button
              onClick={downloadAbdmWhitepaper}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#0284C7',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0369A1'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0284C7'}
            >
              <Download size={16} />
              <span>Download Whitepaper (.txt)</span>
            </button>

            <button
              onClick={printAbdmDossier}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '12px',
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
            >
              <Printer size={16} />
              <span>Print Executive Dossier (A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Proposed open-source deployment architecture */}
      <div style={{ marginTop: '36px', marginBottom: '40px' }}>
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(2, 132, 199, 0.1)', color: '#075985', padding: '4px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 800, marginBottom: '8px' }}>
            <Activity size={14} />
            <span>PROPOSED OPEN-SOURCE CLOUD-NATIVE STACK</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 850, color: '#081C24', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
            Proposed DevOps, Observability & GitOps Infrastructure
          </h2>
          <p style={{ fontSize: '13.5px', color: '#37525C', maxWidth: '850px', lineHeight: 1.5, margin: 0 }}>
            Review deployment configuration files in <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '12.5px', color: '#0F4C5C' }}>deploy/</code>. This workspace did not deploy or verify the topology; production security and data-residency claims remain pending.
          </p>
        </div>

        {/* 4-Pillar Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* 1. K3s / Kubernetes */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(15, 76, 92, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F4C5C' }}>
                <Server size={20} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(52, 211, 153, 0.15)', color: '#047857', padding: '3px 8px', borderRadius: '10px' }}>
                Config present
              </span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: '0 0 4px 0' }}>
              Kubernetes / K3s Microservices
            </h3>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F4C5C', marginBottom: '8px' }}>
              deploy/k8s/ayuswar-deployment.yaml
            </div>
            <p style={{ fontSize: '13px', color: '#486770', lineHeight: 1.5, margin: 0 }}>
              Horizontal Pod Autoscaler (70% CPU threshold), non-root container security context, rolling updates, and automated health probes.
            </p>
          </div>

          {/* 2. Prometheus & Grafana */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C' }}>
                <BarChart3 size={20} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(52, 211, 153, 0.15)', color: '#047857', padding: '3px 8px', borderRadius: '10px' }}>
                Config present
              </span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: '0 0 4px 0' }}>
              Prometheus & Grafana APM
            </h3>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#EA580C', marginBottom: '8px' }}>
              deploy/monitoring/grafana-dashboard-ayuswar.json
            </div>
            <p style={{ fontSize: '13px', color: '#486770', lineHeight: 1.5, margin: 0 }}>
              Sample dashboards for audio RTF, acoustic signal metrics, latency, and simulated emergency workflow queues. No live production metrics are shown here.
            </p>
          </div>

          {/* 3. ArgoCD GitOps */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                <GitBranch size={20} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(52, 211, 153, 0.15)', color: '#047857', padding: '3px 8px', borderRadius: '10px' }}>
                Config present
              </span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: '0 0 4px 0' }}>
              ArgoCD Declarative GitOps
            </h3>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284C7', marginBottom: '8px' }}>
              deploy/argocd/ayuswar-gitops-app.yaml
            </div>
            <p style={{ fontSize: '13px', color: '#486770', lineHeight: 1.5, margin: 0 }}>
              Proposed continuous-delivery configuration for a GitHub main branch with drift detection, pruning, and rollback hooks; not deployed in this audit.
            </p>
          </div>

          {/* 4. Traefik & Sovereign Mesh */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857' }}>
                <Radio size={20} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(52, 211, 153, 0.15)', color: '#047857', padding: '3px 8px', borderRadius: '10px' }}>
                Config present
              </span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: '0 0 4px 0' }}>
              Traefik Cloud-Native Ingress
            </h3>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857', marginBottom: '8px' }}>
              deploy/docker-compose.enterprise.yml
            </div>
            <p style={{ fontSize: '13px', color: '#486770', lineHeight: 1.5, margin: 0 }}>
              Proposed reverse-proxy and TLS configuration for app traffic. It does not establish ABDM isolation or a deployed zero-leak boundary.
            </p>
          </div>
        </div>

        {/* 1-Command Startup Box */}
        <div style={{
          background: '#091E26',
          borderRadius: '14px',
          padding: '16px 20px',
          color: '#E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#6EE7B7', fontWeight: 800, marginBottom: '4px' }}>
              Local Production Cluster Command (Zero Setup)
            </div>
            <code style={{ fontSize: '13px', color: '#FFFFFF', fontFamily: 'monospace', fontWeight: 700 }}>
              docker compose -f deploy/docker-compose.enterprise.yml up -d
            </code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Infrastructure Cost:</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#34D399', background: 'rgba(52, 211, 153, 0.12)', padding: '4px 10px', borderRadius: '8px' }}>
              ₹0.00 / 100% Free Open-Source
            </span>
          </div>
        </div>
      </div>

      {/* Compact 3-Column Interoperability Standards Grid */}
      <div style={{ marginTop: '36px' }}>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#081C24', margin: '0 0 4px 0' }}>
            Core Interoperability & Clinical Schema Standards
          </h2>
          <p style={{ fontSize: '13.5px', color: '#37525C', margin: 0 }}>
            Standard specifications implemented across the client runtime and clinical data exchange layer.
          </p>
        </div>

        <div className="architecture-standards-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: '16px'
        }}>
          {INTEROP_STANDARDS.map((std, idx) => {
            const Icon = std.icon;
            return (
              <div
                key={idx}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #D0DFE2',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `${std.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: std.color,
                    marginBottom: '12px'
                  }}>
                    <Icon size={20} />
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: '0 0 4px 0' }}>
                    {std.title}
                  </h3>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: std.color, marginBottom: '8px' }}>
                    {std.tag}
                  </div>
                  <p style={{ fontSize: '13px', color: '#486770', lineHeight: 1.5, margin: 0 }}>
                    {std.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
