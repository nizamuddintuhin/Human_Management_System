﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebApiCore.Models.IncomeTax
{
    public class SlabType
    {
        public int ID { get; set; }
        public string SlabTypeName { get; set; }
        public int SortOrder { get; set;}
        public int CompanyID { get; set; }

    }
}
