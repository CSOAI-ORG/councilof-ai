import {useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useSearch } from "wouter";
import { Search, ExternalLink, ShieldCheck, Boxes, Layers, ArrowRight, Github, Terminal, Cloud, Plug, KeyRound } from "lucide-react";
import registry from "@/data/mcpRegistry.json";

// PLACEHOLDER